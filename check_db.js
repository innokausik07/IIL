require('dotenv').config();
const db = require('./server/config/db');

(async () => {
  try {
    const [rows] = await db.execute('SELECT * FROM access_function WHERE emp_id = "453636" OR uid = "453636"');
    console.log('Access Function Rows:', rows);
    
    const [sub] = await db.execute('SELECT * FROM sub_function_master');
    console.log('Sample sub_functions:', sub.slice(0, 5));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
