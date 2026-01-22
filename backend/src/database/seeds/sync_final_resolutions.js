/**
 * Update ideas với final_resolution từ scenarios đã seed
 * Đảm bảo tất cả ideas liên quan có chung final_resolution
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'smartfactory_db',
  user: 'smartfactory',
  password: 'smartfactory123'
});

async function syncFinalResolutions() {
  console.log('\n🔄 ĐỒNG BỘ FINAL_RESOLUTION CHO TẤT CẢ SCENARIOS\n');
  console.log('='.repeat(60));
  
  // 1. Lấy tất cả scenarios đã seed có final_resolution
  const seededScenarios = await pool.query(`
    SELECT id, title, final_resolution, final_resolution_ja
    FROM ideas 
    WHERE final_resolution IS NOT NULL
    ORDER BY created_at
  `);
  
  console.log(`\n📋 Tìm thấy ${seededScenarios.rows.length} ideas có final_resolution:\n`);
  seededScenarios.rows.forEach((r, i) => {
    console.log(`   [${i+1}] ${r.title.substring(0, 50)}...`);
  });
  
  // 2. Update ideas tương tự chưa có final_resolution
  const updatePairs = [
    { keyword: '%2670%', sourceTitle: 'Ekanban mẫu mã 2670 line RT2 bị cũ mờ chữ, trên số ekanban khó nhìn' },
    { keyword: '%ca 3%ăn%', sourceTitle: 'Thực đơn ăn ca 3 ít món, đồ ăn nguội không đảm bảo chất lượng' },
    { keyword: '%NG%ca 3%', sourceTitle: 'Lỗi chất lượng NG tăng vào ca đêm (ca 3)' },
    { keyword: '%lắp ráp%ca 3%', sourceTitle: 'Giảm lỗi thao tác lắp ráp ca 3 do công nhân mệt mỏi' },
  ];
  
  console.log('\n\n🔧 Cập nhật ideas liên quan:\n');
  
  for (const pair of updatePairs) {
    const source = await pool.query(
      'SELECT final_resolution, final_resolution_ja FROM ideas WHERE title = $1',
      [pair.sourceTitle]
    );
    
    if (source.rows.length > 0) {
      const { final_resolution, final_resolution_ja } = source.rows[0];
      
      const result = await pool.query(`
        UPDATE ideas 
        SET final_resolution = $1, final_resolution_ja = $2
        WHERE title ILIKE $3
          AND final_resolution IS NULL
          AND status IN ('implemented', 'approved', 'in_progress')
        RETURNING title
      `, [final_resolution, final_resolution_ja, pair.keyword]);
      
      if (result.rows.length > 0) {
        console.log(`   ✅ Cập nhật ${result.rows.length} ideas với keyword "${pair.keyword}":`);
        result.rows.forEach(r => console.log(`      - ${r.title.substring(0, 45)}...`));
      }
    }
  }
  
  // 3. Thống kê lại
  console.log('\n\n📊 THỐNG KÊ SAU KHI CẬP NHẬT:\n');
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN final_resolution IS NOT NULL THEN 1 END) as with_resolution,
      COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embedding
    FROM ideas
    WHERE status = 'implemented'
  `);
  
  console.log(`   Implemented ideas: ${stats.rows[0].total}`);
  console.log(`   Có final_resolution: ${stats.rows[0].with_resolution}`);
  console.log(`   Có embedding: ${stats.rows[0].with_embedding}`);
  
  console.log('\n✅ Đồng bộ hoàn thành!\n');
  await pool.end();
}

syncFinalResolutions().catch(err => {
  console.error('Error:', err);
  pool.end();
});
