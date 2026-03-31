const { executeTransaction, getmultipleSP } = require("../helpers/sp-caller");
const Income = {
  Save_Income_Type: async (data) => {
    const result = await executeTransaction("Save_Income_Type", [
      data.Income_Type_Id || 0,
      data.Income_Type_Name,
      data.Income_Category_Id,
    ]);
    return result;
  },
  Save_Income: async (data) => {
    const result = await executeTransaction("Save_Income", [
      data.Income_Id || 0,
      data.Expense_Type_Id || 0,
      data.User_Id,
      data.Amount,
      data.Description || '',
      data.Account_Id,
      data.Account_Name
    ]);
    return result;
  },
  Save_Income_Category: async (data) => {
    const result = await executeTransaction("Save_Income_Category", [
      data.Income_Category_Id || 0,
      data.Income_Category_Name,
    ]);
    return result;
  },
  getmultipleSP: async (sp, params) => {
      return await getmultipleSP(sp, params);
  },
  Get_Income_Category: async () => {
    const result = await getmultipleSP("Get_Income_Category", []);
    return result;
  },
  Delete_Income_Category: async (id) => {
    const result = await executeTransaction("Delete_Income_Category", [id]);
    return result;
  },
  Get_Income_Type: async () => {
    const result = await getmultipleSP("Get_Income_Type", []);
    return result;
  },
  Get_IncomeList: async () => {
    const result = await getmultipleSP("Get_IncomeList", []);
    return result;
  },
  Delete_Income_Type: async (id) => {
    const result = await executeTransaction("Delete_Income_Type", [id]);
    return result;
  },
  Delete_Income: async (id) => {
    const result = await executeTransaction("Delete_Income", [id]);
    return result;
  }
};

module.exports = Income;
