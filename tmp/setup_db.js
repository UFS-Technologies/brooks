const mysql = require('mysql2');
const config = {
    host: "DESKTOP-IK6ME8M",
    user: 'root',
    password: 'root',
    database: "brooks",
    multipleStatements: true
};

const conn = mysql.createConnection(config);

const sql = `
DROP PROCEDURE IF EXISTS Save_Followup_Status;
CREATE PROCEDURE Save_Followup_Status(
    IN Status_Id_ INT,
    IN Status_Name_ VARCHAR(100),
    IN Status_Color_ VARCHAR(20),
    IN Description_ VARCHAR(500),
    IN Display_Order_ INT,
    IN Is_Active_ TINYINT(1)
)
BEGIN
    IF Status_Id_ > 0 THEN
        UPDATE followup_status 
        SET Status_Name = Status_Name_, Status_Color = Status_Color_, 
            Description = Description_, Display_Order = Display_Order_, 
            Is_Active = Is_Active_
        WHERE Status_Id = Status_Id_;
        SELECT 1 AS success, 'Updated' AS message;
    ELSE
        INSERT INTO followup_status (Status_Name, Status_Color, Description, Display_Order, Is_Active)
        VALUES (Status_Name_, Status_Color_, Description_, Display_Order_, Is_Active_);
        SELECT LAST_INSERT_ID() AS id, 'Inserted' AS message;
    END IF;
END;

DROP PROCEDURE IF EXISTS Get_Followup_Status;
CREATE PROCEDURE Get_Followup_Status()
BEGIN
    SELECT * FROM followup_status WHERE Delete_Status = 0 ORDER BY Display_Order ASC;
END;

DROP PROCEDURE IF EXISTS Delete_Followup_Status;
CREATE PROCEDURE Delete_Followup_Status(IN Status_Id_ INT)
BEGIN
    UPDATE followup_status SET Delete_Status = 1 WHERE Status_Id = Status_Id_;
    SELECT 1 AS success;
END;

-- Add Status Menu Item if not exists
INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
SELECT 'Status', '/admin/Follow_up_Status', NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE Route = '/admin/Follow_up_Status');
`;

conn.query(sql, (err, results) => {
    if (err) {
        console.error("Error creating SPs:", err.message);
    } else {
        console.log("SPs and Menu Item created successfully");
    }
    conn.end();
});
