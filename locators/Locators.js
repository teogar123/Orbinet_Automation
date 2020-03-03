const Locators = function () {

/**
 * 
 * @description Locators to Find the Elements to Interact and Validate Them!!!
 * 
 */
CREATE_ACCOUNT_BUTTON = "//button[contains(@class,'btn secondary')]";
EMAIL_FIELD = "//input[@name='email']";
CONFIRM_EMAIL_FIELD = "//input[@name='confirmEmail']"
PASSWORD_FIELD = "//input[@name='password']"
CONFIRM_PASSWORD_FIELD = "//input[@name='confirmPassword']"
CREATE_ACCOUNT_CHECKBOX = "//span[@class='checkmark']"
CREATE_ACCOUNT_SUBMIT_BUTTON = "//div[@class='ozine-popup create-account']//span[contains(text(),'Crear tu cuenta')]"
/**
 * 
 * @description Locators to login to Orbinetwork platform***!
 * 
 */
LOGIN_ORBI_BUTTON = "//button[contains(@class,'btn primary')]"
EMAIL_TO_LOGIN_FIELD = "//input[@name='email']"
PASSWORD_TO_LOGIN_FIELD = "//input[@name='password']"
LOGIN_TO_ORBI_BUTTON = "//div[@class='button-container']//button[text()='Iniciar sesión']"
ORBINETWORK_LOGO = "//img[@class='logo']"
TO_UPLOAD_FOTO =  "//button[contains(@class,'btn button outline btnPicture')]"
WHICH_IS_YOUR_NAME_FIELD = '/html[1]/body[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/input[1]'
WHICH_IS_YOUR_LASTNAME_FIELD = '/html[1]/body[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/input[1]'
CREATE_YOUR_COMPANY_BUTTON = '/html[1]/body[1]/div[1]/div[2]/div[1]/div[2]/div[2]/div[1]/button[1]'
/**
 * 
 * @description Locators to Company Register flows***!
 * 
 */

}
module.exports = new Locators