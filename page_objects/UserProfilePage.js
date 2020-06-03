const locators = require('../locators/Locators')
const actions = require('../base/Actions');
const data = require('../test_data/Data');


function UserProfilePage () {
    this.userProfileButton = element(by.xpath("//img[@class='user-avatar']"))
    this.permisosTab = element(by.xpath("//span[@id='permisos']"));
    this.alertasTab = element(by.xpath("//span[@id='permisos']"));
    this.notificacionesTab =element(by.xpath("//span[@id='notificaciones']"));

    /**
     * 
     * @dessciption Manage the User Profile view
     * 
     */

    this.manageProfileFLow = () => {
        actions.clickToElement(this.userProfileButton);
        browser.sleep(4000)
        
        if (this.permisosTab.isDisplayed,
             this.alertasTab.isDisplayed,
             this.notificacionesTab.isDisplayed){
            console.log("Is present");
        }else {
            console.log("Is Not");
        }
        browser.sleep(3000);
        
        const arrayElements = [this.permisosTab,
             this.alertasTab, this.notificacionesTab];
        console.log(arrayElements.length)
        arrayElements.forEach(function(arrayElement){
            actions.clickToElement(arrayElement);
            console.log("Is present and clicked")
        });
        browser.sleep(3000);          
        
     }

}
module.exports = new UserProfilePage();