"""
Incident Router - RAG Department Suggestion  
Multi-field matching + Voting - MAX score approach
Dynamic weights: Use 100% semantic when no multi-field provided
"""
from typing import Dict, List
import re
import datetime
from collections import defaultdict

from database import db
from embedding_service import embedding_service
from config import Config

MIN_CHARS = 10
MIN_WORDS = 2


class IncidentRouter:
    """Router goi y department - Multi-field + Voting (MAX score)"""

    def _validate_input(self, description: str) -> tuple:
        """Validate input"""
        if not description or not description.strip():
            return False, "Empty"

        desc = description.strip()
        if len(desc) < MIN_CHARS:
            return False, f"Too short ({len(desc)} < {MIN_CHARS})"

        words = desc.split()
        if len(words) < MIN_WORDS:
            return False, f"Too few words ({len(words)} < {MIN_WORDS})"

        no_space = desc.replace(' ', '').lower()
        if re.search(r'(.)\1{4,}', no_space):
            return False, "Spam detected"

        return True, "OK"

    def _calculate_location_similarity(self, loc1: str, loc2: str) -> float:
        if not loc1 or not loc2:
            return 0.0
        loc1, loc2 = loc1.lower().strip(), loc2.lower().strip()
        if loc1 == loc2:
            return 1.0
        if loc1 in loc2 or loc2 in loc1:
            return 0.7
        common = set(loc1.split()) & set(loc2.split())
        if common:
            return 0.5 * len(common) / max(len(loc1.split()), len(loc2.split()))
        return 0.0

    def _calculate_type_similarity(self, type1: str, type2: str) -> float:
        if not type1 or not type2:
            return 0.0
        return 1.0 if type1.lower() == type2.lower() else 0.0

    def suggest_department(
        self,
        description: str,
        location: str = None,
        incident_type: str = None,
        priority: str = None
    ) -> Dict:
        """Goi y department - dung MAX score cua top candidates"""
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        desc_log = description[:80].encode('ascii', 'replace').decode('ascii')
        print(f"\n[{ts}] ========== RAG SUGGESTION ==========")
        print(f"[{ts}] Desc: {desc_log}...")
        print(f"[{ts}] Multi-field: loc={location}, type={incident_type}, pri={priority}")

        # Validate
        is_valid, reason = self._validate_input(description)
        if not is_valid:
            print(f"[{ts}] REJECTED: {reason}")
            return {
                'success': True,
                'suggestion': None,
                'similar_incidents': [],
                'message': f'Mo ta khong hop le: {reason}',
                'validation_error': reason
            }

        # Stage 1: Retrieve
        embedding = embedding_service.encode(description, is_query=True)
        candidates = db.find_similar(embedding, limit=20)
        candidates = [dict(c) for c in candidates]
        print(f"[{ts}] Stage 1: Retrieved {len(candidates)} candidates")

        if not candidates:
            return {
                'success': True,
                'suggestion': None,
                'similar_incidents': [],
                'message': 'Khong tim thay incident tuong tu.'
            }

        # Stage 2: Use similarity scores (reranker removed)
        candidate_texts = [c['description'] for c in candidates]
        rerank_scores = [c['similarity'] for c in candidates]
        rerank_threshold = Config.MIN_SIMILARITY
        print(f"[{ts}] Stage 2: Using raw similarity scores")

        # Stage 3: Multi-field scoring - Dynamic weights
        # If no multi-field data provided, use 100% semantic score
        has_location = location is not None and len(str(location).strip()) > 0
        has_type = incident_type is not None and len(str(incident_type).strip()) > 0
        has_priority = priority is not None and len(str(priority).strip()) > 0
        
        # Dynamic weight calculation
        if not has_location and not has_type and not has_priority:
            # No multi-field: use 100% semantic score
            W_SEMANTIC = 1.0
            W_LOCATION = 0.0
            W_TYPE = 0.0
            W_PRIORITY = 0.0
        else:
            # Base weights
            W_SEMANTIC = 0.60
            W_LOCATION = 0.20 if has_location else 0.0
            W_TYPE = 0.15 if has_type else 0.0
            W_PRIORITY = 0.05 if has_priority else 0.0
            
            # Normalize to sum = 1.0
            total_weight = W_SEMANTIC + W_LOCATION + W_TYPE + W_PRIORITY
            if total_weight > 0:
                W_SEMANTIC /= total_weight
                W_LOCATION /= total_weight
                W_TYPE /= total_weight
                W_PRIORITY /= total_weight
        
        print(f"[{ts}] Weights: SEM={W_SEMANTIC:.2f}, LOC={W_LOCATION:.2f}, TYPE={W_TYPE:.2f}, PRI={W_PRIORITY:.2f}")

        for i, c in enumerate(candidates):
            c['rerank_score'] = float(rerank_scores[i])
            c['semantic_score'] = c['rerank_score']
            c['location_score'] = self._calculate_location_similarity(
                location, c.get('location', '')
            ) if has_location else 0.0
            c['type_score'] = self._calculate_type_similarity(
                incident_type, c.get('incident_type', '')
            ) if has_type else 0.0
            c['priority_score'] = 1.0 if has_priority and c.get('priority') == priority else 0.0
            c['final_score'] = (
                W_SEMANTIC * c['semantic_score'] +
                W_LOCATION * c['location_score'] +
                W_TYPE * c['type_score'] +
                W_PRIORITY * c['priority_score']
            )

        # Filter by rerank threshold
        valid_candidates = [c for c in candidates if c['rerank_score'] >= rerank_threshold]
        if not valid_candidates:
            print(f"[{ts}] ALL REJECTED")
            return {
                'success': True,
                'suggestion': None,
                'similar_incidents': candidates[:5],
                'message': 'Khong tim thay incident phu hop.'
            }

        # Stage 4: Voting - Use MAX of top 3 scores per department
        dept_scores: Dict[str, List[float]] = defaultdict(list)
        dept_info: Dict[str, dict] = {}

        for c in valid_candidates:
            dept_id = c.get('assigned_department_id')
            if dept_id:
                dept_id = str(dept_id)
                dept_scores[dept_id].append(c['final_score'])
                if dept_id not in dept_info:
                    dept_info[dept_id] = {
                        'department_id': dept_id,
                        'department_name': c.get('department_name', 'Unknown')
                    }

        # Use MAX of top 3 scores (not weighted average)
        dept_max_scores = {}
        for dept_id, scores in dept_scores.items():
            top_scores = sorted(scores, reverse=True)[:3]
            # Average of top 3 (or less if fewer)
            dept_max_scores[dept_id] = sum(top_scores) / len(top_scores)

        print(f"[{ts}] Department Scores (max of top 3):")
        for did, score in sorted(dept_max_scores.items(), key=lambda x: x[1], reverse=True)[:3]:
            print(f"[{ts}]   {dept_info[did]['department_name']}: {score:.4f} ({len(dept_scores[did])} votes)")

        # Select best
        best_dept_id = max(dept_max_scores, key=dept_max_scores.get)
        best_score = dept_max_scores[best_dept_id]
        best_name = dept_info[best_dept_id]['department_name']
        vote_count = len(dept_scores[best_dept_id])

        decision = db.should_auto_assign(best_score)
        auto_assign = decision['auto_assign']

        print(f"[{ts}] SUGGESTED: {best_name} ({best_score*100:.1f}%)")
        print(f"[{ts}] AUTO_ASSIGN: {'YES' if auto_assign else 'NO'}")
        print(f"[{ts}] =====================================\n")

        if auto_assign:
            msg = f'Tu dong gan: {best_name} ({best_score*100:.0f}%)'
        else:
            msg = f'Goi y: {best_name} ({best_score*100:.0f}%)'

        return {
            'success': True,
            'suggestion': {
                'department_id': best_dept_id,
                'department_name': best_name,
                'confidence': best_score,
                'vote_count': vote_count,
                'auto_assign': auto_assign
            },
            'similar_incidents': valid_candidates[:5],
            'message': msg,
            'auto_assign_info': decision,
            'department_scores': {
                dept_info[did]['department_name']: {'score': score, 'votes': len(dept_scores[did])}
                for did, score in dept_max_scores.items()
            }
        }

    def find_similar_incidents(self, description: str, limit: int = 5) -> Dict:
        embedding = embedding_service.encode(description, is_query=True)
        similar = db.find_similar(embedding, limit=limit)
        return {'success': True, 'count': len(similar), 'incidents': [dict(s) for s in similar]}

    def auto_fill_form(self, description: str) -> Dict:
        embedding = embedding_service.encode(description, is_query=True)
        similar = db.find_similar(embedding, limit=1)
        if not similar:
            return {'success': True, 'suggestions': {}, 'confidence': 0.0, 'reference_incident_id': None}
        best = similar[0]
        return {
            'success': True,
            'suggestions': {'department_id': str(best['assigned_department_id']) if best['assigned_department_id'] else None, 'department_name': best['department_name']},
            'confidence': float(best['similarity']),
            'reference_incident_id': str(best['id'])
        }


router = IncidentRouter()
