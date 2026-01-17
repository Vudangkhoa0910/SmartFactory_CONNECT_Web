/**
 * KAIZEN BANK ROUTES
 * API routes cho Ngân hàng Kaizen - Kho lưu trữ các ý tưởng đã triển khai
 * 
 * THEO SRS v2.1:
 * - Ideas (Hòm thư góp ý) = Hòm trắng + Hòm hồng → ideas.routes.js
 * - Kaizen Bank = Kho lưu trữ các ideas đã implemented → Đây là file này
 */

const express = require('express');
const router = express.Router();
const kaizenController = require('../controllers/kaizen-bank.controller');

// =====================================================
// IDEAS STATISTICS (Thống kê Hòm thư góp ý)
// Phải đặt trước các routes có :id
// =====================================================

// Thống kê Ideas (Hòm trắng + Hòm hồng)
router.get('/ideas-statistics', kaizenController.getIdeasStatistics);

// Lấy danh sách Ideas đã implemented sẵn sàng đưa vào Kaizen Bank
router.get('/implemented-ideas', kaizenController.getImplementedIdeasForKaizen);

// =====================================================
// KAIZEN BANK ROUTES
// =====================================================

// Lấy danh sách Kaizen
router.get('/', kaizenController.getAllKaizens);

// Thống kê Kaizen (SRS Section 11.2)
router.get('/statistics', kaizenController.getKaizenStatistics);

// Xuất dữ liệu cho Excel/Word (SRS Section 18.3)
router.get('/export', kaizenController.exportKaizenData);

// Lấy tiêu chí đánh giá
router.get('/evaluation-criteria', kaizenController.getEvaluationCriteria);

// Hiệu suất Kaizen theo phòng ban
router.get('/department-performance', kaizenController.getDepartmentPerformance);

// Lấy thông tin chi tiết Kaizen
router.get('/:id', kaizenController.getKaizenById);

// Tạo Kaizen trực tiếp (không từ Idea)
router.post('/', kaizenController.createKaizen);

// Tạo Kaizen từ Idea đã triển khai (QUAN TRỌNG)
router.post('/from-idea', kaizenController.createKaizenFromIdea);

// Cập nhật Kaizen
router.put('/:id', kaizenController.updateKaizen);

// Xóa Kaizen
router.delete('/:id', kaizenController.deleteKaizen);

// Thêm điểm đánh giá
router.post('/:id/evaluate', kaizenController.addEvaluationScore);

// Nhân rộng Kaizen sang phòng ban/khu vực khác
router.post('/:id/replicate', kaizenController.replicateKaizen);

module.exports = router;
