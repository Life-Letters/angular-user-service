'use strict';

/**
 * Checks if the logged in user is of the type specified via the attribute.
 */
angular.module('life.users')
  .directive('showUser', function ($rootScope) {
    return {
      link: function postLink(scope, element, attrs) {
        $rootScope.$watch('loggedInUser.userType', function() {
          if ( $rootScope.loggedInUser && (attrs.showUser === '' || $rootScope.loggedInUser.is(attrs.showUser)) ) {
            element.attr('style', '');
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
            element.attr('style', '');
          }
        });
      }
    };
  });