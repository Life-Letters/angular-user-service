'use strict';

/**
 * Checks if the logged in user is of the type specified via the attribute.
 */
angular.module('life.users')
  .directive('showUser', function ($rootScope) {
    return {
      link: function postLink(scope, element, attrs) {
        // ''         = no condition / ignore
        // 'true'     = user logged in
        // 'false'    = no user
        // 'String'   = match user type
        $rootScope.$watch('loggedInUser.userType', function() {
          if ( attrs.showUser === '' ||
              (!$rootScope.loggedInUser && attrs.showUser === 'false') ||
              $rootScope.loggedInUser && (attrs.showUser === 'true' || $rootScope.loggedInUser.is(attrs.showUser)) ) {

            element.attr('style', (element.attr('style')+'').replace('display:none;', ''));
          } else {
            element.attr('style', 'display:none;');
          }
        });
      }
    };
  })
  .directive('showAnonymous', function ($rootScope) {
    return {
      link: function postLink(scope, element, attrs) {
        $rootScope.$watch('loggedInUser.userType', function() {
          if ( $rootScope.loggedInUser ) {
            element.attr('style', 'display:none;');
          } else {
            element.attr('style', (element.attr('style')+'').replace('display:none;', ''));
          }
        });
      }
    };
  });