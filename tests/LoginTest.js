const loginPage = require('../page_objects/LoginPage');
const page = require('../page_objects/Page');
const companyRegisterPage = require('../page_objects/CompanyRegisterPage');
const userProfilePage = require('../page_objects/UserProfilePage');
const axios = require('axios');
const { browser } = require('protractor');
const routerLoaderPage = require('../page_objects/RoutesLoaderPage');
const routeForwardAndback = require('../page_objects/RouteForwardAndback');


/**
 * 
 * @description Login to Orbinetwork Platform in QA Environment!!!
 * 
 */
 
 let routes = [800632,
    100875,
    800875,
    853800,
    300496,
    875800,
    300495,
    100079,
    900800,
    200143,
    853875,
    100175,
    800495,
    800853,
    800223,
    100170,
    100078,
    300800,
    300369,
    853249,
    300875,
    100210,
    632800,
    800900,
    100080,
    800059,
    800300,
    500059,
    800051,
    800326,
    300239,
    800230,
    100082,
    800387,
    875100,
    300315,
    100169,
    100171,
    100168,
    800100,
    800270,
    100081,
    100800,
    200155,
    200156,
    800041,
    100138,
    100596,
    300244,
    400291]

    let routeBacks = [800632,
        100875,
        800875,
        853800,
        300496,
        875800,
        300495,
        100079,
        900800,
        200143,
        853875,
        100175,
        800495,
        800853,
        800223,
        100170,
        100078,
        300800,
        300369,
        853249,
        300875,
        100210,
        632800,
        800900,
        100080,
        800059,
        800300,
        500059,
        800051,
        800326,
        300239,
        800230,
        100082,
        800387,
        875100,
        300315,
        100169,
        100171,
        100168,
        800100,
        800270,
        100081,
        100800,
        200155,
        200156,
        800041,
        100138,
        100596,
        300244,
        400291]

        let vehiculeVariations = ['X1','X2','Z1','Z2','Z4','Z9','ZF','ZG','ZH','X1',
        'X2','Z1','Z2','Z4','Z9','ZF','ZG','ZH',
        'X1','X2','Z1','Z2','Z4','Z9','ZF','ZG',
        'ZH','X1','X2','Z1','Z2','Z4','Z9','ZF','ZG','ZH',
        'X1','X2','Z1','Z2','Z4','Z9','ZF','ZG','ZH',
        'X1','X2','Z1','Z2','Z4','Z2','Z4',
    ]
            console.log(vehiculeVariations);

beforeAll( function () {
    page.openUrl();
});

/**describe('Insert and Update Function for Routes', function () {
    it('Test Start', async function () {
        //loginPage.createAccountFlow(); 
        //loginPage.loginToOrbiNetworkPlattform();
        for(var i = 0; i < 1; i++) {
        let payload = await routerLoaderPage.routesLoaderFunction(routes[i]);
        await routerLoaderPage.routesModifierFunction(payload); 
        //companyRegisterPage.companyRegister();
        } 
    });

});*/

describe('Insert Origin and Arrival data and Invert the Routes Values', function () {
    it('Test Start', async function () {
        for(var i = 0; i < 49; i++) {
       let payload = await routeForwardAndback.routesForwardAndBack(routes[i], routeBacks[i], vehiculeVariations[i]);
        }
    })
} )

