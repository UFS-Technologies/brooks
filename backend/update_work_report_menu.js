const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'brooks_db',
  multipleStatements: true,
};

async function updateWorkReportMenu() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    await connection.query(`
      INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
      SELECT 'Work Report', '/admin/Work_Report', NULL, 0
      FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1 FROM menu WHERE Route = '/admin/Work_Report'
      );
    `);

    const [menuRows] = await connection.query(
      "SELECT Menu_ID FROM menu WHERE Route = '/admin/Work_Report' LIMIT 1"
    );

    if (!menuRows.length) {
      throw new Error('Unable to find Work Report menu after insert.');
    }

    const menuId = menuRows[0].Menu_ID;

    const [adminUsers] = await connection.query(
      'SELECT User_ID FROM users WHERE User_Type_Id = 1 AND IFNULL(Delete_Status, 0) = 0'
    );

    for (const user of adminUsers) {
      await connection.query(
        `
          INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
          SELECT ?, ?, 1, 1, 1, 1, 0
          FROM DUAL
          WHERE NOT EXISTS (
            SELECT 1 FROM user_menu_selection WHERE Menu_Id = ? AND User_Id = ?
          );
        `,
        [menuId, user.User_ID, menuId, user.User_ID]
      );
    }

    console.log('Work Report menu created/verified successfully.');
  } catch (error) {
    console.error('Failed to update Work Report menu:', error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateWorkReportMenu();
