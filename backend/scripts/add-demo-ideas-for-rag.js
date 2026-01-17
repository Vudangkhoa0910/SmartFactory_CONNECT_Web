/**
 * Script thêm dữ liệu demo cho RAG
 * Tạo các ý kiến/ý tưởng tương tự nhau để demo tính năng "xN ủng hộ"
 * 
 * Run: docker exec -it smartfactory-backend node scripts/add-demo-ideas-for-rag.js
 */

require('dotenv').config();
const db = require('../src/config/database');

// Các nhóm ý kiến tương tự - mỗi nhóm có nhiều người cùng ý kiến
// Valid categories: process_improvement, cost_reduction, quality_improvement, 
// safety_enhancement, productivity, innovation, environment, workplace, other
const demoIdeaGroups = [
  // Nhóm 1: An toàn lao động - cải thiện ánh sáng (5 người cùng ý kiến)
  {
    topic: 'Cải thiện ánh sáng',
    ideas: [
      {
        title: 'Tăng cường ánh sáng khu vực sản xuất',
        description: 'Đề xuất lắp thêm đèn LED công nghiệp tại khu vực dây chuyền lắp ráp, hiện tại ánh sáng yếu gây mỏi mắt và khó kiểm tra chất lượng sản phẩm',
        expected_benefit: 'Giảm 30% lỗi sản phẩm, cải thiện sức khỏe mắt cho công nhân',
        category: 'safety_enhancement',
        subtype: 'opinion'
      },
      {
        title: 'Lắp đèn chiếu sáng cho dây chuyền A',
        description: 'Dây chuyền A thiếu ánh sáng, công nhân phải căng mắt để làm việc, đề nghị bổ sung hệ thống đèn LED',
        expected_benefit: 'Tăng năng suất làm việc, giảm mệt mỏi',
        category: 'safety_enhancement',
        subtype: 'opinion'
      },
      {
        title: 'Cần thêm đèn khu vực kiểm tra chất lượng',
        description: 'Khu QC hiện tại ánh sáng không đủ để kiểm tra chi tiết nhỏ, cần lắp đèn LED độ sáng cao',
        expected_benefit: 'Phát hiện lỗi sản phẩm tốt hơn, giảm tỷ lệ hàng lỗi',
        category: 'quality_improvement',
        subtype: 'opinion'
      },
      {
        title: '照明改善の提案',
        description: '生産エリアの照明を改善する必要があります。現在の照明では製品の検査が困難です',
        expected_benefit: '品質向上、作業効率アップ',
        category: 'safety_enhancement',
        subtype: 'opinion'
      },
      {
        title: 'Đề xuất cải thiện hệ thống chiếu sáng nhà xưởng',
        description: 'Toàn bộ khu vực sản xuất cần được nâng cấp hệ thống đèn chiếu sáng để đảm bảo an toàn và hiệu quả làm việc',
        expected_benefit: 'Môi trường làm việc tốt hơn, an toàn hơn',
        category: 'safety_enhancement',
        subtype: 'idea'
      }
    ]
  },
  
  // Nhóm 2: Cải thiện canteen (4 người cùng ý kiến)
  {
    topic: 'Cải thiện canteen',
    ideas: [
      {
        title: 'Mở rộng khu vực canteen',
        description: 'Canteen hiện tại quá nhỏ, vào giờ cao điểm công nhân phải xếp hàng rất lâu. Đề xuất mở rộng diện tích và tăng số bàn ghế',
        expected_benefit: 'Giảm thời gian chờ đợi, tăng sự hài lòng của nhân viên',
        category: 'workplace',
        subtype: 'opinion'
      },
      {
        title: 'Tăng thêm ghế ngồi ở nhà ăn',
        description: 'Số lượng ghế ở canteen không đủ cho ca trưa, nhiều người phải đứng ăn hoặc ăn ở hành lang',
        expected_benefit: 'Nhân viên được nghỉ ngơi đầy đủ trong giờ ăn',
        category: 'workplace',
        subtype: 'opinion'
      },
      {
        title: 'Nâng cấp nhà ăn công ty',
        description: 'Nhà ăn cần được cải thiện về cơ sở vật chất: bàn ghế mới, máy lạnh, và đa dạng thực đơn',
        expected_benefit: 'Nâng cao chất lượng bữa ăn cho công nhân viên',
        category: 'workplace',
        subtype: 'idea'
      },
      {
        title: '食堂の改善提案',
        description: '食堂のスペースを拡大し、座席数を増やす必要があります。昼食時間に混雑しています',
        expected_benefit: '従業員の満足度向上',
        category: 'workplace',
        subtype: 'opinion'
      }
    ]
  },
  
  // Nhóm 3: Tự động hóa quy trình (3 người cùng ý kiến)
  {
    topic: 'Tự động hóa',
    ideas: [
      {
        title: 'Tự động hóa quy trình đóng gói',
        description: 'Đề xuất triển khai robot đóng gói tự động để thay thế công việc thủ công, giúp tăng tốc độ và độ chính xác',
        expected_benefit: 'Tăng năng suất 50%, giảm sai sót đóng gói',
        category: 'process_improvement',
        subtype: 'idea'
      },
      {
        title: 'Ý tưởng robot hóa khâu đóng hộp',
        description: 'Khâu đóng hộp sản phẩm hiện tại làm thủ công tốn nhiều nhân lực, nên đầu tư máy đóng hộp tự động',
        expected_benefit: 'Tiết kiệm 5 nhân công mỗi ca',
        category: 'cost_reduction',
        subtype: 'idea'
      },
      {
        title: '包装の自動化提案',
        description: '包装工程にロボットを導入して生産性を向上させることを提案します',
        expected_benefit: '生産性50%向上、人件費削減',
        category: 'process_improvement',
        subtype: 'idea'
      }
    ]
  },
  
  // Nhóm 4: Điều hòa nhiệt độ (4 người cùng ý kiến)
  {
    topic: 'Nhiệt độ nhà xưởng',
    ideas: [
      {
        title: 'Lắp thêm quạt công nghiệp',
        description: 'Khu vực sản xuất rất nóng vào mùa hè, cần lắp thêm quạt công nghiệp hoặc hệ thống làm mát',
        expected_benefit: 'Cải thiện môi trường làm việc, tăng hiệu suất',
        category: 'environment',
        subtype: 'opinion'
      },
      {
        title: 'Đề xuất hệ thống làm mát nhà xưởng',
        description: 'Nhiệt độ trong xưởng thường xuyên trên 35 độ C, ảnh hưởng đến sức khỏe công nhân. Đề xuất lắp hệ thống cooling pad',
        expected_benefit: 'Giảm nhiệt độ 5-7 độ C, bảo vệ sức khỏe nhân viên',
        category: 'environment',
        subtype: 'idea'
      },
      {
        title: 'Cần cải thiện thông gió xưởng sản xuất',
        description: 'Hệ thống thông gió hiện tại không hiệu quả, không khí bí bách và nóng nực',
        expected_benefit: 'Không khí trong lành hơn, giảm oi bức',
        category: 'environment',
        subtype: 'opinion'
      },
      {
        title: '工場の冷却システム改善',
        description: '夏季の工場内温度が高すぎます。冷却システムの改善が必要です',
        expected_benefit: '作業環境改善、生産性向上',
        category: 'environment',
        subtype: 'opinion'
      }
    ]
  },
  
  // Nhóm 5: Đào tạo nhân viên (3 người cùng ý kiến)
  {
    topic: 'Đào tạo kỹ năng',
    ideas: [
      {
        title: 'Tổ chức đào tạo kỹ năng mới',
        description: 'Đề xuất công ty tổ chức các khóa đào tạo nâng cao kỹ năng cho công nhân, bao gồm vận hành máy móc mới và an toàn lao động',
        expected_benefit: 'Nâng cao tay nghề, giảm tai nạn lao động',
        category: 'productivity',
        subtype: 'idea'
      },
      {
        title: 'Chương trình training định kỳ',
        description: 'Cần có lịch training hàng tháng để cập nhật kiến thức mới và ôn lại quy trình cho nhân viên',
        expected_benefit: 'Đồng bộ hóa kiến thức, cải thiện chất lượng',
        category: 'productivity',
        subtype: 'opinion'
      },
      {
        title: '従業員研修プログラムの提案',
        description: '新しい機械の操作方法と安全教育の定期的な研修を提案します',
        expected_benefit: 'スキル向上、安全意識向上',
        category: 'productivity',
        subtype: 'idea'
      }
    ]
  }
];

async function addDemoIdeas() {
  console.log('🚀 Bắt đầu thêm dữ liệu demo cho RAG...\n');
  
  try {
    // Lấy department mặc định
    const deptResult = await db.query(`
      SELECT id FROM departments WHERE code = 'PROD' OR code = 'HR' LIMIT 1
    `);
    const departmentId = deptResult.rows[0]?.id || null;
    
    // Lấy user mặc định
    const userResult = await db.query(`
      SELECT id FROM users WHERE role != 'admin' LIMIT 5
    `);
    const userIds = userResult.rows.map(r => r.id);
    
    if (userIds.length === 0) {
      console.log('⚠️ Không tìm thấy user. Bỏ qua.');
      return;
    }
    
    let totalAdded = 0;
    
    for (const group of demoIdeaGroups) {
      console.log(`\n📝 Nhóm: ${group.topic}`);
      
      for (let i = 0; i < group.ideas.length; i++) {
        const idea = group.ideas[i];
        const userId = userIds[i % userIds.length];
        
        try {
          const result = await db.query(`
            INSERT INTO ideas (
              title,
              description,
              expected_benefit,
              category,
              status,
              ideabox_type,
              whitebox_subtype,
              submitter_id,
              department_id,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
            RETURNING id, title
          `, [
            idea.title,
            idea.description,
            idea.expected_benefit,
            idea.category,
            'pending', // Status mặc định
            'white',   // ideabox_type
            idea.subtype || 'idea', // whitebox_subtype
            userId,
            departmentId
          ]);
          
          console.log(`  ✅ Đã thêm: ${result.rows[0].title.substring(0, 40)}...`);
          totalAdded++;
        } catch (err) {
          if (err.code === '23505') { // Duplicate
            console.log(`  ⏭️ Đã tồn tại: ${idea.title.substring(0, 30)}...`);
          } else {
            console.error(`  ❌ Lỗi: ${err.message}`);
          }
        }
      }
    }
    
    console.log(`\n✨ Hoàn thành! Đã thêm ${totalAdded} ý kiến/ý tưởng demo`);
    
    // Hiển thị thống kê
    const stats = await db.query(`
      SELECT 
        category, 
        whitebox_subtype,
        COUNT(*) as count 
      FROM ideas 
      GROUP BY category, whitebox_subtype 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Thống kê hiện tại:');
    for (const row of stats.rows) {
      console.log(`  - ${row.category || 'N/A'} (${row.whitebox_subtype || 'idea'}): ${row.count} ý kiến`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await db.pool.end();
  }
}

addDemoIdeas();
