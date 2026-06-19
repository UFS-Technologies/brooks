const db = require("../backend/config/dbconnection");

async function check() {
  try {
    const sql = `
      SELECT 
        SUM(CASE WHEN s.Status_Id = 11 THEN 1 ELSE 0 END) as NewLeads,
        SUM(CASE WHEN s.Follow_Up_Date < CURRENT_DATE() AND IFNULL(s.Status_Id, 0) NOT IN (17, 22) THEN 1 ELSE 0 END) as MissedLeads,
        SUM(CASE WHEN s.Follow_Up_Date = CURRENT_DATE() OR s.Status_Id = 25 THEN 1 ELSE 0 END) as FollowupLeads,
        SUM(CASE WHEN s.Status_Id = 17 THEN 1 ELSE 0 END) as NotInterestedLeads,
        SUM(CASE WHEN s.To_User_Id IS NOT NULL AND s.To_User_Id <> s.By_User_Id THEN 1 ELSE 0 END) as TransferredLeads,
        SUM(CASE WHEN s.Status_Id IN (16, 22) THEN 1 ELSE 0 END) as ClosedLeads,
        COUNT(s.Student_ID) as TotalLeads,
        SUM(CASE WHEN s.Status_Id = 11 THEN 1 ELSE 0 END) as FreshLeads,
        SUM(CASE WHEN s.Follow_Up_Date > CURRENT_DATE() AND IFNULL(s.Status_Id, 0) NOT IN (17, 22) THEN 1 ELSE 0 END) as UpcomingFollowup
      FROM student s
      WHERE IFNULL(s.Delete_Status, 0) = 0
    `;

    const [rows] = await db.promise().query(sql);
    console.log("Dashboard Summary Result:", rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
