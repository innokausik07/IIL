const functions = [
  { id: 2, function_id: 'FN02', function_name: 'Asset Management', tab: 2 }
];

const subFunctions = [
  { id: 5, function_id: 'FN02', sub_name: 'Asset Master (Fleet)', sub_seq: 1, file_name: '/assets/asset-master' },
  { id: 99, function_id: 'FN02', sub_name: 'Other Asset Master', sub_seq: 2 }
];

// Test cases
const testCases = [
  { name: 'Proper IDs', rows: [{ sub_function_id: '5', function_id: 'FN02' }] },
  { name: 'String undefined', rows: [{ sub_function_id: 'undefined', function_id: 'FN02' }] },
  { name: 'Null DB string', rows: [{ sub_function_id: 'null', function_id: 'FN02' }] },
  { name: 'Empty string', rows: [{ sub_function_id: '', function_id: 'FN02' }] },
  { name: 'Real Null', rows: [{ sub_function_id: null, function_id: 'FN02' }] },
  { name: 'Mismatch Name', rows: [{ sub_function_id: 'Asset Master (Fleet)', function_id: 'FN02' }] }
];

for (const tc of testCases) {
  const allowedSubValues = new Set();
  const wildcardFnIds = new Set();
  
  tc.rows.forEach(r => {
    const subId = String(r.sub_function_id || '').trim().toLowerCase();
    const fnId = String(r.function_id || '').trim().toLowerCase();
    
    if (subId && subId !== 'null' && subId !== '0' && subId !== 'undefined') {
      allowedSubValues.add(subId);
    } 
    if (fnId && fnId !== 'null' && fnId !== '0' && fnId !== 'undefined') {
      wildcardFnIds.add(fnId);
    }
  });

  const menuTree = functions.map(fn => {
    const fnCode = String(fn.function_id || '').trim().toLowerCase();
    const fnIdStr = String(fn.id).trim().toLowerCase();

    const children = subFunctions.filter(sub => {
      const subFnCode = String(sub.function_id || '').trim().toLowerCase();
      const subIdStr = String(sub.id).trim().toLowerCase();
      const subName = String(sub.sub_name || '').trim().toLowerCase();
      const subFile = String(sub.file_name || '').trim().toLowerCase();

      const isChild = !subFnCode || subFnCode === fnCode || subFnCode === fnIdStr;
      if (!isChild) return false;

      if (allowedSubValues.size === 0 && wildcardFnIds.size === 0) return false;

      const isExplicitlyGranted = 
        allowedSubValues.has(subIdStr) || 
        allowedSubValues.has(subFnCode) || 
        allowedSubValues.has(subName) || 
        allowedSubValues.has(subFile);

      if (isExplicitlyGranted) return true;

      const parentGranted = wildcardFnIds.has(subFnCode) || wildcardFnIds.has(fnCode) || wildcardFnIds.has(fnIdStr);
      if (parentGranted) {
         const hasOtherSiblingsGranted = subFunctions.some(sibling => {
            const sibFn = String(sibling.function_id || '').trim().toLowerCase();
            const sibId = String(sibling.id).trim().toLowerCase();
            const sibName = String(sibling.sub_name || '').trim().toLowerCase();
            if (sibFn === fnCode || sibFn === fnIdStr) {
               return allowedSubValues.has(sibId) || allowedSubValues.has(sibName);
            }
            return false;
         });
         
         if (!hasOtherSiblingsGranted) {
            return true;
         }
      }
      return false;
    });

    return { ...fn, sub_functions: children };
  }).filter(fn => fn.sub_functions.length > 0);

  console.log(`[${tc.name}] Children matched:`, menuTree.length > 0 ? menuTree[0].sub_functions.map(c=>c.sub_name) : []);
}
