const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.html')) results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const texts = [
  'Add Enquiry', 'Save Student', 'choose file', 'Add Expense',
  'Add Income', 'Add Staff', 'Save', 'Add Enquiry Source',
  'Search', 'Add Expense Category', 'Add Expense Type',
  'Add Course', 'More Option', 'Add Status'
];

const regex = new RegExp('<button([^>]*)>([\\s\\S]*?)<\\/button>', 'gi');

walk('c:/Users/SAPNA/Documents/GitHub/brooks/frontend/src/app/admin/components', (err, results) => {
  if (err) throw err;
  let modifiedCount = 0;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    content = content.replace(regex, (match, attrs, inner) => {
      const matchText = texts.some(t => inner.toLowerCase().includes(t.toLowerCase()));
      if (matchText) {
        if (!attrs.includes('style="background-color: blue !important; color: white !important;"')) {
          changed = true;
          if (attrs.includes('style="')) {
            attrs = attrs.replace('style="', 'style="background-color: blue !important; color: white !important; ');
          } else {
            attrs += ' style="background-color: blue !important; color: white !important;"';
          }
          return '<button' + attrs + '>' + inner + '</button>';
        }
      }
      return match;
    });
    
    // Also handle button components like spans and divs used as buttons if they literally have the text. 
    // But user explicitly asked for 'button'. We should check if some are <a> tags or something.
    // The previous grep_search showed things like:
    // <span class="material-symbols-outlined">add</span> Add Status
    // But they were inside a button?
    // <div class="..."> + Add Enquiry Source </div> ? Wait, "enquiry-source.component.html" 
    
    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedCount++;
      console.log('Modified:', file);
    }
  });
  console.log('Total files modified:', modifiedCount);
});
