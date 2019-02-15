import AuthenticationContext from './msadal/AuthenticationContext';
var AuthenticationResult = require("./msadal/AuthenticationResult");

function MSAdalLogin(authority, clientId, redirectUri, resourceUri) {
  // Shows the user authentication dialog box if required

  return new Promise(function(resolve, reject) {
    // First attempt to login silently using the cache and keychain functions
    // If this fails the prompt the user for their credentials

    let context = new AuthenticationContext(authority);
    context.tokenCache.readItems().then(function(items) {
      if (items.length > 0) {
        context = new AuthenticationContext(items[0].authority);
      }

      // Attempt to authorize the user silently
      context.acquireTokenSilentAsync(resourceUri, clientId).then(
        function(authDetails) {
          resolve(authDetails);
        },
        function() {
          // We require user credentials, so this triggers the authentication dialog box
          context.acquireTokenAsync(resourceUri, clientId, redirectUri).then(
            function(authDetails) {
              resolve(authDetails);
            },
            function(err) {
              reject(err);
            }
          );
        }
      );
    });
  });
}

function MSAdalLogout(authority, redirectUri) {
  let context = new AuthenticationContext(authority);
  context.tokenCache.clear();
  const promise = fetch(
    "https://login.windows.net/common/oauth2/logout?post_logout_redirect_uri=" +
      redirectUri
  );
  promise.then(response => true);

  return promise;
}

function getValidMSAdalToken(authority, resourceUri) {
  let context = new AuthenticationContext(authority);
  return context.tokenCache.readItems().then(function(items) {
    for (let i = items.length - 1; i >= 0; i--) {
      let lastToken = items[i];
      let requestedResourceUri = resourceUri || lastToken.resourceUri;
      if ( lastToken.accessToken
            && requestedResourceUri === lastToken.resourceUri
            && lastToken.expiresOn > new Date() ) {
        return new AuthenticationResult(lastToken);
      }
    }
  });
}

const MSAdalAuthenticationContext = AuthenticationContext;
export {getValidMSAdalToken, MSAdalLogin, MSAdalLogout, MSAdalAuthenticationContext};
