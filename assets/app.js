// Define HTML element variables
/******************************* */
const videoFrame = document.querySelector('#frame');
const scan = document.querySelector('#start');
const scanResult = document.querySelector('#result');
const manualEntry = document.querySelector('#enter');


// Start scan to parse upc from barcode
/************************************** */
scan.addEventListener('click', () => {
    // toggle visibily to bring video preview into view
    videoFrame.classList.toggle('hidden');

    // initialize async/await
    Quagga.init({
        inputStream : {
          name : "Live",
          type : "LiveStream",
          target: document.querySelector('#frame')  // highlight where in DOM to load preview
        },
        decoder : {
          readers : ["upc_reader"] // specify which type of barcode reader
        },
      }, function(err) {
          if (err) {
              console.log(err);
              return
          }
          console.log("Initialization finished. Ready to start");

          // Start scanning the bardcode
          Quagga.start() 
          //Quagga.onProcessed(callback);

          // On detection process results of scan
          Quagga.onDetected(function(result) {
            if(result.codeResult) {
                console.log("result", result.codeResult.code); // log to console as test
                //scanResult.innerText = `Result: ${result.codeResult.code}`; // place in DOM as preview
                Quagga.stop();
                videoFrame.classList.add('hidden'); // hide preview on completion
            } else {
                document.querySelector('#result').innerText = "not detected"; // display error text
                videoFrame.classList.add('hidden'); // hide preivew on error
            }
        });
      })
    });



// Fetch function for querying Food API to get results
/***************************************************** */
function getFetch() {
    const typeUPC = document.querySelector('#barcode').value;

    const userInput = typeUPC || scanUPC;

    if (userInput.length !== 12) {
        alert(`Please ensure that barcode is 12 characters in length.`)
        return;
    }

    const url = `https://world.openfoodfacts.org/api/v0/product/${userInput}.json`;
    
    fetch(url)
        .then( res => res.json() ) // parse resopnse as .json
        .then( data => {
            // verify that producg is found
            if (!data.status) {
                alert(`Product ${userInput} not found. Please try another.`);
            } else {
                const item = new FoodInfo(data.product);
                item.showInfo();
                item.listIngredients();
            }
        })
        .catch( err => {
            console.log( `error: ${err}`);
        })
};

// Build out results object and create table for responses
/********************************************************* */
class FoodInfo {
    constructor(productInfo) {
        this.name = productInfo.product_name;
        this.ingredients = productInfo.ingredients;
        this.image = productInfo.image_url;
    }

    showInfo() {
        document.querySelector('#product-img').src = this.image;
        document.querySelector('#product-name').innerText = this.name;
    }

    listIngredients() {
        const tableRef = document.querySelector('#ingredient-table');
        for (let i = 1; i < tableRef.rows.length;) {
            tableRef.deleteRow(i);
        }
        if (!(this.ingredients == null)) {
            for(let key in this.ingredients) {
                // create new rows are the item builds itself out
                const newRow = tableRef.insertRow(-1);
                // add new cells, one for inredients, one for veggie status, to each row
                const newIngredientCell = newRow.insertCell(0);
                const newVeggieCell = newRow.insertCell(1); 
                // create text node in the new ingredient cell & define its value
                const ingredientText = document.createTextNode(
                    this.ingredients[key].text
                );
                // create text node in the new veggie status cell & define its value
                const veggieStatus = !this.ingredients[key].vegetarian ? 'unknown' : this.ingredients[key].vegetarian; // ternary to confirm this field is not falsy
                const veggieText = document.createTextNode(veggieStatus);
                // append text node to each new cell as child of each new cell
                newIngredientCell.appendChild(ingredientText);
                newVeggieCell.appendChild(veggieText);
            }
        }
    }
}