let parsedData = [];
let headerRow = []; // Store the header separately

document.getElementById('loadFiles').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const csvTableContainer = document.getElementById('csvTableContainer');
    csvTableContainer.innerHTML = ''; // Clear previous content

    if (files.length === 0) {
        alert('Please select one or more CSV files.');
        return;
    }

    parsedData = []; // Reset parsed data for new files
    headerRow = []; // Reset header row

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const csvData = event.target.result;
            const rows = parseCSV(csvData);
            
            // Store header only from the first file
            if (index === 0) {
                headerRow = rows[0]; // Take the first row as the header
            }
            
            // Add all valid rows excluding headers from this file
            const validRows = rows.slice(1).filter(row => {
                console.log("Processing row:", row);
                
                const dateTimeStr = row[0]; // Assuming the first column is the date and time
                const [datePart, timePart] = dateTimeStr.split(' '); // Split into date and time parts

                console.log("Validating date:", datePart, "and time:", timePart);

                const isValid = isValidDateTime(datePart, timePart); 
                if (!isValid) {
                    console.warn("Invalid date and time format, removing row:", row);
                }
                return isValid; 
            });
            parsedData = parsedData.concat(validRows);
        };

        reader.readAsText(file);
    });

    document.getElementById('formatData').style.display = 'block';
});

function parseCSV(data) {
    const rows = data.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    return rows;
}

document.getElementById('formatData').addEventListener('click', () => {
    const csvTableContainer = document.getElementById('csvTableContainer');
    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    
    // Use the stored headerRow
    headerRow.forEach(cell => {
        const th = document.createElement('th');
        th.innerText = cell;
        tr.appendChild(th);
    });
    
    thead.appendChild(tr);
    table.appendChild(thead);

    const uniqueData = removeDuplicates(parsedData); 
    const sortedData = sortByDateTime(uniqueData);

    const tbody = document.createElement('tbody');
    
    sortedData.forEach(row => {
        const tr = document.createElement('tr');
        
        row.forEach(cell => {
            const td = document.createElement('td');
            td.innerText = cell;
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    
    csvTableContainer.appendChild(table);
    
    document.getElementById('downloadXLSX').style.display = 'block';
});

function removeDuplicates(data) {
   const seen = new Set();
   return data.filter(row => {
       const dateTime = row[0]; 
       if (seen.has(dateTime)) {
           return false; 
       }
       seen.add(dateTime);
       return true; 
   });
}

function sortByDateTime(data) {
   return data.sort((a, b) => {
       const dateA = parseDateTime(a[0]); 
       const dateB = parseDateTime(b[0]); 
       return dateA - dateB; 
   });
}

function parseDateTime(dateTimeStr) {
   if (!dateTimeStr) {
       console.error("DateTime string is undefined or empty:", dateTimeStr);
       return new Date(0); // Return epoch date for invalid entries
   }

   const [datePart, timePart] = dateTimeStr.split(' ');
   const [day, month, year] = datePart.split('/').map(Number);
   let [hours, minutes] = timePart.split(':').map(Number);

   if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
       console.error("Invalid date/time components:", { day, month, year, hours, minutes });
       return new Date(0); // Return epoch date for invalid entries
   }

   return new Date(year, month - 1, day, hours, minutes);
}

function isValidDateTime(datePart, timePart) {
   const dateTimePattern = /^\d{2}\/\d{2}\/\d{4}$/; 
   const timePattern = /^\d{2}:\d{2}$/; 
   
   return dateTimePattern.test(datePart) && 
          (timePattern.test(timePart) || /^\d{2}:\d{2} (AM|PM)$/.test(timePart));
}

document.getElementById('downloadXLSX').addEventListener('click', () => {
   const csvTableContainer = document.getElementById('csvTableContainer');
   const visibleRows = Array.from(csvTableContainer.querySelectorAll("table tbody tr")).filter(row => row.style.display !== 'none');
   
   // Prepare data for XLSX
   const dataToExport = [];
   
   // Use the stored headerRow
   if (headerRow.length > 0) {
       dataToExport.push(headerRow.map(cell => cell)); // Ensure header is properly formatted
   }
   
   // Get data from visible rows
   visibleRows.forEach(row => {
       const rowData = Array.from(row.children).map(cell => cell.innerText);
       dataToExport.push(rowData);
   });

   // Create worksheet and workbook
   const ws = XLSX.utils.aoa_to_sheet(dataToExport); 
   const wb = XLSX.utils.book_new(); 
   XLSX.utils.book_append_sheet(wb, ws, "Sheet1"); 

   // Prompt for file name and save the file
   const fileName = prompt("Enter the file name:", "data.xlsx") || "data.xlsx";
   
   XLSX.writeFile(wb, fileName); 
});