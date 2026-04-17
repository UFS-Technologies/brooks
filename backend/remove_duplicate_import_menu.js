const db = require('./config/dbconnection.js');

async function removeDuplicateMenu() {
    const menuIdToRemove = 1003; // Menu with incorrect route '/admin/Lead_Import'
    
    db.query('UPDATE menu SET Delete_Status = 1 WHERE Menu_ID = ?', [menuIdToRemove], (e1, r1) => {
        if (e1) {
            console.error('Error updating menu:', e1);
            process.exit(1);
        }
        console.log('Menu updated (Delete_Status set to 1):', r1.affectedRows, 'row(affected)');

        db.query('DELETE FROM user_menu_selection WHERE Menu_Id = ?', [menuIdToRemove], (e2, r2) => {
            if (e2) {
                console.error('Error deleting user_menu_selection:', e2);
                process.exit(1);
            }
            console.log('User menu selection deleted:', r2.affectedRows, 'row(s) deleted');
            process.exit(0);
        });
    });
}

removeDuplicateMenu();
