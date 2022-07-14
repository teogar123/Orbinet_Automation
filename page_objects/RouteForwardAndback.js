const loginPage = require('../page_objects/LoginPage');
const page = require('../page_objects/Page');
const companyRegisterPage = require('../page_objects/CompanyRegisterPage');
const userProfilePage = require('../page_objects/UserProfilePage');
const axios = require('axios');
const { browser } = require('protractor');



function RouteForwardAndBack () {
    /**
 * 
 * 
 * @Description Functions to create Routes with determinated Forward code and invert it for back travel 
 * 
 */


beforeAll( function () {
    page.openUrl();
 });

 
 

 this.routesForwardAndBack = async (route, routeBack, vehiculeVariation, newValue) => {
    
    var randomNumbers = Math.floor(Math.random() * 10000000);
    var monthRandomNumbers =   Math.floor(Math.random(5) * 12) +  1;
    var dayRandomNumbers = Math.floor(Math.random() * 30) + 1;
    console.log(monthRandomNumbers);
    console.log(dayRandomNumbers);
    console.log("2022-"+ monthRandomNumbers +   '-' + dayRandomNumbers);
    let tknum = "1703" + randomNumbers;
    let tknum2 = "1704" + randomNumbers;
    let signi = "17032022" + randomNumbers;

    console.log(route);
    const str = routeBack.toString();
    const item = str;
    newValue = item.substring(3,6) + item.substring(0,3)
    console.log(newValue);
    console.log(vehiculeVariation);
    typeof vehiculeVariation;
    
    

    var payload = {

            "token": "yCNtVJteysucc2xgaFXdBnJyRAWAjCuJkMMNc",
            "action": "insert",
            "data": [
              {
                "TKNUM": tknum,
                "TDLNR": "10007538",
                "VSART": vehiculeVariation,
                "AEDAT": "2022-"+ monthRandomNumbers +  '-' + dayRandomNumbers,
                "AEZET": "00:46:40",
                "KNOTA": "16019",
                "KNOTZ": "1000000080",
                "SHTYP": "Z006",
                "ROUTE": route,
                "DPREG": "2022-03-28",
                "DPTEN": "2022-03-30",
                "SIGNI": signi,
                "ADD01": "",
                "ADD03": "TP04",
                "NAME_TRANS": "ZETA TRANSPORTES S.A. DE C.V.",
                "UPREG": "23:00:00",
                "UPTEN": "22:34:00",
                "STTRG": "7",
                "TEXT1": "",
                "TEXT2": "",
                "TEXT3": "MP13",
                "TEXT4": "{}[220326]|1|",
                "VBELN": "0907594719",
                "WERKS_O": "MP13",
                "WERKS_D": "MP13",
                "WBSTK_S": "",
                "WBSTK_E": "C",
                "LFIMG_P": 36.000,
                "SGE_S": "",
                "SGE_E": "C_C",
                "ANZPK": "00036",
                "entregas": [],
                "F_ELIM": ""
              },
              
              {
                "TKNUM": tknum2,
                "TDLNR": "0010094198",
                "VSART": vehiculeVariation,
                "AEDAT": "2022-"+ monthRandomNumbers +  '-' + dayRandomNumbers,
                "AEZET": "00:46:40",
                "KNOTA": "16019",
                "KNOTZ": "1000000080",
                "SHTYP": "Z006",
                "ROUTE": newValue,
                "DPREG": "2022-03-28",
                "DPTEN": "2022-03-30",
                "SIGNI": signi,
                "ADD01": "ZE00",
                "ADD03": "TP04",
                "NAME_TRANS": "ZETA TRANSPORTES S.A. DE C.V.",
                "UPREG": "23:00:00",
                "UPTEN": "22:34:00",
                "STTRG": "7",
                "TEXT1": "",
                "TEXT2": "",
                "TEXT3": "MP13",
                "TEXT4": "{}[220326]|1|",
                "VBELN": "0907594719",
                "WERKS_O": "MP13",
                "WERKS_D": "MP13",
                "WBSTK_S": "",
                "WBSTK_E": "C",
                "LFIMG_P": 36.000,
                "SGE_S": "",
                "SGE_E": "C_C",
                "ANZPK": "00036",
                "entregas": [],
                "F_ELIM": ""
                }
            ]
}
const response = await axios.post('https://qa.v2.orbinetwork.com/api/v2/bridge/octopus/receiver', payload)
    .then(function(res) {
        console.log('Here');
        console.log(res.data)
})
    .catch(function(err) {
        console.log('fail'); 
        console.log(err.status);
});
    
return payload;
    
    
    }
    

 

};
module.exports = new RouteForwardAndBack();