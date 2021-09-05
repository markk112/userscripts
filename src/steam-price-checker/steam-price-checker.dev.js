
(() => {
    'use strict';

    // Converts a roman numeral to an integer
    async function convertRomNumToInt(str1) {
        if (str1 == null) return -1;
        var num = await charToInt(str1.charAt(0));
        var pre, curr;

        for (var i = 1; i < str1.length; i++) {
            curr = await charToInt(str1.charAt(i));
            pre = await charToInt(str1.charAt(i - 1));
            if (curr <= pre) {
                num += curr;
            } else {
                num = num - pre * 2 + curr;
            }
        }
        return num;
    }
    async function charToInt(char) {
        switch (char) {
            case 'I': return 1;
            case 'V': return 5;
            case 'X': return 10;
            case 'L': return 50;
            case 'C': return 100;
            case 'D': return 500;
            case 'M': return 1000;
            default: return -1;
        }
    }

    // Displays an alert as a li element in the price check div
    async function displayAlert(message, capitalise = true) {
        const tilesBannerNode = document.querySelector('.game_title_area ul');
        const li = document.createElement('li');
        if (capitalise) {
            message = message.toUpperCase();
        }
        li.innerHTML = `
            <p style="text-align: center; display: block; width: 100%; font-size: 14px; color: #fff; font-weight: bold;">${message}</p>
        `.trim();
        tilesBannerNode.appendChild(li);
    }

    // Calculate the price difference between the reduced price and the original price
    async function calcPriceDifference(newPrice) {
        let difference;
        try {
            let gamePurchasePriceNode;
            gamePurchasePriceNode = document.querySelector('div.game_purchase_price.price');
            if (!gamePurchasePriceNode) {
                gamePurchasePriceNode = document.querySelector('div.discount_final_price');
            }
            const originalGamePrice = gamePurchasePriceNode.innerText.trim().substring(1);
            difference = (originalGamePrice - newPrice).toFixed(2);
        } catch (err) {
            difference = 'Error!';
        }
        return difference;
    }

    // Translate the AllKeyShop document into a DOM html object and extract gameId
    function getGameIdFromResponse(responseText) {
        const allKeyShopDOM = new DOMParser().parseFromString(responseText, 'text/html');
        let gameId = '';
        try {
            gameId = allKeyShopDOM.querySelector('div.row script').innerHTML.match(/(?<=gameId: )[0-9]+/gm)[0];
        } catch (err) {
            return false;
        }
        return gameId;
    }

    // Get the current Steam store game name, if it contains roman numerals then sanitise
    async function getGameName(shortened = false) {
        // Return format: 'steam-game-name'
        const steamGameName = window.location.href.match(/(?<=\d\/)(.*?)(?=\/)/gm)[0];
        const formattedGameName = steamGameName.replace(/_/g, '-').toLowerCase();
        let convertedInt = 0;
        let romanNumeralFound = false;
        let romNumIndex = 0;
        let finalGameName = formattedGameName;
        const romanNumRegex = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
        const splitGameName = formattedGameName.split('-');
        for (const word of splitGameName) {
            const upperWord = word.toUpperCase();
            if (romanNumRegex.test(upperWord)) {
                convertedInt = await convertRomNumToInt(upperWord);
                romNumIndex = splitGameName.indexOf(word);
                romanNumeralFound = true;
                continue;
            }
        }
        if (romanNumeralFound) {
            splitGameName[romNumIndex] = convertedInt;
            finalGameName = splitGameName.join('-');
        }
        if (shortened) {
            let shortenedGameName = '';
            let gameNameNums = '';
            for (const shortWord of splitGameName) {
                if (!(typeof shortWord === 'number')) {
                    shortenedGameName += shortWord[0];
                } else {
                    gameNameNums += shortWord;
                }
            }
            finalGameName = shortenedGameName + '-' + gameNameNums;
        }
        return finalGameName;
    }

    // Get the key website name from the key website url
    async function getKeyWebsiteNameFromUrl(url) {
        let keyWebsiteName;
        const allKeyWebsiteNames = [
            'GAMIVO', 'ENEBA', 'G2A', 'CDKEYS',
            'KINGUIN', 'K4G', 'HRKGAME', 'INSTANT-GAMING'
        ];
        for (let i = 0; i < allKeyWebsiteNames.length; i++) {
            if (url.includes(allKeyWebsiteNames[i].toLowerCase())) {
                keyWebsiteName = allKeyWebsiteNames[i];
                break;
            }
        }
        if (keyWebsiteName) {
            return keyWebsiteName.toLowerCase();
        } else {
            return false;
        }
    }

    // Convert game price float to formatted string with 0 added on to single digits
    async function convertPriceFloatToStr(priceFloat) {
        let priceStr = String(priceFloat);
        if (priceStr[1] === '.' && priceStr.length === 3) {
            priceStr = priceStr + '0';
        }
        if (priceStr[2] === '.' && priceStr.length === 4) {
            priceStr = priceStr + '0';
        }
        return priceStr;
    }

    // Checks the current Steam store game page to see if the game is free
    function isGameFree() {
        try {
            const gamePurchasePriceNode = document.querySelector('div.game_purchase_price.price');
            if (gamePurchasePriceNode.textContent.trim().toLowerCase().includes('free')) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }
    }

    // Outputs formatted prettier messages to console
    function brandedConsoleOutput(output) {
        console.log(`%c Steam %cPrice %cChecker %c %c${output}`,
            'background-color: #000; color: #17A863;',
            'background-color: #000; color: #F54339;',
            'background-color: #000; color: #1CCE78;',
            'background-color: none;',
            'color: #ABABAB; text-decoration: underline;');
    }

    // Send a request promise and return either error or url text contents
    async function sendRequest(url, method, headers = {}) {
        return new Promise((resolve, reject) => {
            try {
                GM_xmlhttpRequest({
                    method: method,
                    url: url,
                    headers: headers,
                    onload: function (response) {
                        resolve(response.responseText);
                    },
                    onerror: function (error) {
                        reject(error);
                    }
                });
            } catch (err) {
                console.log('REQUEST PROMISE FAILED! FATAL ERROR: ', err);
            }
        });
    }

    // Translate big api json, perform operations on it and output into manageable sanitised data
    async function sanitiseJsonOutput(json) {
        const gamePriceEntries = [];
        const unlistedPriceEntries = [];

        for (let jsonPriceEntry of json) {
            let keyWebsiteUrl;

            if (!jsonPriceEntry.affiliateUrl.includes('?')) {
                try {
                    keyWebsiteUrl = jsonPriceEntry.affiliateUrl.match(/.+(?=\?)/gm)[0];
                } catch (err) {
                    //console.log('Error! Cannot match keyWebsiteUrl Regex ', jsonPriceEntry.affiliateUrl);
                    keyWebsiteUrl = jsonPriceEntry.affiliateUrl;
                }
            } else {
                keyWebsiteUrl = jsonPriceEntry.affiliateUrl;
            }
            const keyWebsiteName = await getKeyWebsiteNameFromUrl(keyWebsiteUrl);
            const keyWebsitePrice = jsonPriceEntry.price.gbp.price;

            if (!keyWebsiteName) {
                unlistedPriceEntries.push(keyWebsiteUrl);
            } else {
                if (gamePriceEntries.length != 0) {
                    let gamePriceExists = false;
                    for (let gamePriceEntry of gamePriceEntries) {
                        if (gamePriceEntry[0] == keyWebsiteName) {
                            gamePriceExists = true;
                        }
                    }
                    if (!gamePriceExists) {
                        gamePriceEntries.push([keyWebsiteName, keyWebsiteUrl,
                            { gbp: keyWebsitePrice, priceDifference: await calcPriceDifference(keyWebsitePrice), bestOffer: false }])
                    }
                } else {
                    gamePriceEntries.push([keyWebsiteName, keyWebsiteUrl,
                        { gbp: keyWebsitePrice, priceDifference: await calcPriceDifference(keyWebsitePrice), bestOffer: true }])
                }
            }
        }
        return gamePriceEntries;
    }

    // Add the game price entries to the DOM
    async function loadTiles(gamePriceEntries) {
        const tilesBannerNode = document.querySelector('.game_title_area ul');
        const tilesInBanner = 5;
        let tilesCounter = 0;

        for (const gamePriceEntry of gamePriceEntries) {
            const tileNode = document.createElement('li');

            if (gamePriceEntry[2].bestOffer) {
                tileNode.classList.add('low-price');
            }
            tileNode.innerHTML = `
                <a href="${gamePriceEntry[1]}" target="_blank" rel="noopener noreferrer" >
                    <p class="store-name">${gamePriceEntry[0]}</p>
                    <p class="store-price">£${await convertPriceFloatToStr(gamePriceEntry[2].gbp)}</p>
                    <p class="price-diff">-£${gamePriceEntry[2].priceDifference}</p>
                </a>
            `.trim();
            tilesBannerNode.appendChild(tileNode);
            tilesCounter += 1;
            if (tilesCounter === tilesInBanner) {
                break;
            }
        }
    }

    // Get prices in Json format from the AllKeyShop API using the game ID
    async function requestPricesFromApi(gameId) {
        const rawJson = await sendRequest(
            `https://www.allkeyshop.com/blog/wp-admin/admin-ajax.php?action=get_offers&product=${gameId}&currency=gbp&region=&moreq=&use_beta_offers_display=0`,
            'GET',
            {
                "accept": "*/*",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,la;q=0.7",
                "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            });
        const parsedJson = JSON.parse(rawJson).offers;
        return parsedJson;
    }

    // Get the all key shop api game id using the game name
    async function getGameId(gameName) {
        const requestResponse = await sendRequest(`https://www.allkeyshop.com/blog/en-gb/buy-${gameName}-cd-key-compare-prices/`, 'GET');
        const gameId = await getGameIdFromResponse(requestResponse);
        if (!gameId) {
            return false;
        } else {
            return gameId;
        }
    }

    // Get the json of lowest prices for the current Steam store page game
    async function getGamePrices() {
        let gameId;
        if (!(gameId = await getGameId(await getGameName()))) {
            if (!(gameId = await getGameId(await getGameName(true)))) {
                return false;
            }
        }
        return await requestPricesFromApi(gameId);
    }

    // Inject developer-only banner and debug options
    async function runDevOptions() {
        const gameTitleRowDiv = document.querySelector('.game_title_area');
        const underDevBanner = document.createElement('div');
        underDevBanner.innerHTML = `
                <div style="background-color: #f7e490; padding: 5px 0;">
                    <p style="text-align: center; font-size: 14px; color: #171a21;">Steam Price Check Plugin - Under Development</p>
                </div>
            `.trim();
        gameTitleRowDiv.appendChild(underDevBanner);
    }

    // Inject the base of the checker into the Steam store game page and style it
    async function injectUserScriptStyling() {
        const gameTitleRowDiv = document.querySelector('.game_title_area');
        const priceCheckRow = document.createElement('ul');
        priceCheckRow.id = 'devx-spc';

        priceCheckRow.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@100;400;700&display=swap');

                .page_title_area.game_title_area.page_content ul {
                    list-style: none;
                    display: none;
                    justify-content: space-evenly;
                    font-family: 'IBM Plex Sans Arabic', sans-serif;
                    color: #67c1f5;
                    padding: 10px 5px;
                    background-image: linear-gradient(90deg, rgba(12, 17, 25, 0.5), rgba(35, 51, 74, 0.2));
                }
                .page_title_area.game_title_area.page_content ul li {
                    width: 100%;
                    padding: 0 5px;
                    min-height: 0;
                    min-width: 0;
                }

                .page_title_area.game_title_area.page_content ul li a {
                    display: block;
                    background-color: rgba( 103, 193, 245, 0.2 );
                    text-align: center;
                    color: inherit;
                    border-radius: 4px;
                    overflow: auto;
                }
                .page_title_area.game_title_area.page_content ul li a:hover {
                    cursor: pointer;
                    color: #fff;
                    background-image: linear-gradient(135deg, rgb(103, 193, 245) 0%, rgb(65, 122, 155) 100%);
                }
                .page_title_area.game_title_area.page_content ul li.low-price a {
                    color: #d2efa9;
                    background: -webkit-linear-gradient( top, #6fa720 5%, #588a1b 95%);
                }
                .page_title_area.game_title_area.page_content ul li.low-price a:hover {
                    cursor: pointer;
                    background: -webkit-linear-gradient( top, #8ED629 5%, #6AA621 95%);
                    color: #fff;
                }

                .page_title_area.game_title_area.page_content ul li a p {
                    line-height: 1;
                }
                .page_title_area.game_title_area.page_content ul li a p.store-price {
                    margin-bottom: 10px;
                    margin-top: 4px;
                    color: inherit;
                    font-size: 12px;
                    font-family: inherit;
                    display: inline-block;
                }
                .page_title_area.game_title_area.page_content ul li a p.store-name {
                    margin-top: 10px;
                    font-family: inherit;
                    font-size: 14px;
                    text-transform: uppercase;
                    color: inherit;
                    font-weight: bold;
                }
                .page_title_area.game_title_area.page_content ul li a p.price-diff {
                    display: inline-block;
                    color: #8f98a0;
                }
                .page_title_area.game_title_area.page_content ul li a:hover p.price-diff {
                    color: #b1b7bd;
                }
                .page_title_area.game_title_area.page_content ul li.low-price a p.price-diff {
                    color: #a8bf87;
                }
                .page_title_area.game_title_area.page_content ul li.low-price a:hover p.price-diff {
                    color: #b9cc9f;
                }
            </style>
        `.trim();
        gameTitleRowDiv.appendChild(priceCheckRow);
    }

    // Start the userscript
    async function userscriptInit() {
        const devMode = true;

        if (devMode) {
            runDevOptions();
        }
        if (!isGameFree()) {
            injectUserScriptStyling();
            const gamePrices = await getGamePrices();
            if (gamePrices && gamePrices.length > 0) {
                const gamePriceEntries = await sanitiseJsonOutput(gamePrices);
                await loadTiles(gamePriceEntries);
            } else {
                displayAlert('Game not found!');
                brandedConsoleOutput('Game has not been found in the All Key Shop database! Please check manually.');
            }
        } else {
            brandedConsoleOutput('Free game! Price check aborted.');
        }
        document.querySelector('#devx-spc').style.display = 'flex';
    }

    // Wait until page has been loaded
    window.addEventListener('DOMContentLoaded', function (event) {
        userscriptInit();
    }, false);
    
})();