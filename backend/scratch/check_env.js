require('dotenv').config();
console.log('PORT:', process.env.PORT);
console.log('FB_VERIFY_TOKEN:', process.env.FB_VERIFY_TOKEN);
console.log('FB_PAGE_ACCESS_TOKEN exists:', !!process.env.FB_PAGE_ACCESS_TOKEN);
