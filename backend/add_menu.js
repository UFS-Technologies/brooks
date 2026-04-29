const db = require('./config/dbconnection.js');

const menuName = 'My Students';
const route = '/admin/My_Students';
const allowedUserTypes = [1, 2, 3];

async function ensureMyStudentsMenu() {
  const connection = db.promise();

  await connection.query(
    `
      INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
      SELECT ?, ?, NULL, 0
      WHERE NOT EXISTS (
        SELECT 1
        FROM menu
        WHERE Menu_Name = ? OR Route = ?
      )
    `,
    [menuName, route, menuName, route]
  );

  await connection.query(
    `
      UPDATE menu
      SET Menu_Name = ?, Route = ?, Parent_Menu_ID = NULL, Delete_Status = 0
      WHERE Menu_Name = ? OR Route = ?
    `,
    [menuName, route, menuName, route]
  );

  const [menuRows] = await connection.query(
    'SELECT Menu_ID FROM menu WHERE Menu_Name = ? AND Route = ? LIMIT 1',
    [menuName, route]
  );

  if (!menuRows.length) {
    throw new Error('Unable to create or find My Students menu.');
  }

  const menuId = menuRows[0].Menu_ID;

  await connection.query(
    `
      INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
      SELECT ?, u.User_ID, 1, 1, 1, 1, 0
      FROM users u
      WHERE u.User_Type_Id IN (?)
        AND IFNULL(u.Delete_Status, 0) = 0
        AND NOT EXISTS (
          SELECT 1
          FROM user_menu_selection ums
          WHERE ums.Menu_Id = ?
            AND ums.User_Id = u.User_ID
        )
    `,
    [menuId, allowedUserTypes, menuId]
  );

  await connection.query(
    `
      UPDATE user_menu_selection ums
      JOIN users u ON u.User_ID = ums.User_Id
      SET ums.IsView = 1,
          ums.DeleteStatus = 0
      WHERE ums.Menu_Id = ?
        AND u.User_Type_Id IN (?)
        AND IFNULL(u.Delete_Status, 0) = 0
    `,
    [menuId, allowedUserTypes]
  );

  console.log('My Students menu is configured and assigned to allowed staff users.');
}

ensureMyStudentsMenu()
  .catch((error) => {
    console.error('Failed to configure My Students menu:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    db.end();
  });
