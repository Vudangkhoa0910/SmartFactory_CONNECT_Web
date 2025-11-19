const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

const createUsers = async () => {
  try {
    // 1. Get Production Department ID
    let deptResult = await db.query("SELECT id FROM departments WHERE code = 'PROD'");
    let deptId;
    
    if (deptResult.rows.length === 0) {
      console.log('Creating Production department...');
      const newDept = await db.query(
        "INSERT INTO departments (code, name, description) VALUES ('PROD', 'Production', 'Main production department') RETURNING id"
      );
      deptId = newDept.rows[0].id;
    } else {
      deptId = deptResult.rows[0].id;
    }

    // Hash password
    const password = await bcrypt.hash('123456', 12);

    // 2. Create Worker
    console.log('Creating Worker account...');
    await db.query(`
      INSERT INTO users (employee_code, email, password, full_name, role, level, department_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT (employee_code) 
      DO UPDATE SET password = $3, role = $5, level = $6, department_id = $7
    `, ['EMP001', 'worker@smartfactory.com', password, 'Nguyễn Văn A', 'operator', 6, deptId]);

    // 3. Create Leader
    console.log('Creating Leader account...');
    await db.query(`
      INSERT INTO users (employee_code, email, password, full_name, role, level, department_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT (employee_code) 
      DO UPDATE SET password = $3, role = $5, level = $6, department_id = $7
    `, ['MGR001', 'leader@smartfactory.com', password, 'Trần Thị Q', 'team_leader', 5, deptId]);

    console.log('✅ Default users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
};

createUsers();
