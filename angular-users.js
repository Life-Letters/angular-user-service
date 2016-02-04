'use strict';

/**
 * @ngdoc service
 * @name lifelettersApp.userService
 * @description
 * # userService
 * Service in the lifelettersApp.
 */
angular.module('life.users', ['ngLodash', 'ngCookies'])
  .provider('userService', function () {
    
    var url = null,
        behaviours = {};

    this.setUrl = function(u) { url = u; };
    this.addBehaviour = function(name, func) { 
      behaviours[name] = func; 
    };

    this.$get = function ($log) {
      if ( !url ) {
        $log.warn('please set the user service URL via the userServiceProvider');
        return;
      }
      return {
        url: url,
        behaviours: behaviours,
      };
    };
  })
  .service('users', function (
      $http,
      $location,
      $cookies,
      $timeout,
      $q,
      $log,
      userService,
      lodash) {

    var userCookieName = 'lifeletteruser',
        userTypes = [
          'Clinician',
          'Patient',
        ];

    // Expose the user to the view
    var loggedInUser = null;

    // Adds instance specific methods to the user object
    function initUser(user) {
      // Avoid repeating
      if ( user.sync ) { 
        return user; 
      }

      user.name = function() { 
        return lodash.concat(user.title?[user.title]:[], [user.firstName, user.lastName]).join(' ');
      };

      // Add type helper methods, e.g. isPatient
      angular.forEach(userTypes, function(type) {
        user['is'+type] = function() { return (''+user.userType).toLowerCase() === type.toLowerCase(); }
      });

      user.fetch = function(type, instance) {
        var path = userService.url+'users/'+user.id+'/'+type+(instance ? '/'+instance : '');

        return $http.get(path)
          .then(function(response) {
            return response.data;
          }, function(e) {
            $log.warn(e);
            return $q.reject(e);
          });
      }

      user.isLoggedInUser = function() { 
        return user.id === loggedInUser.id; 
      }

      user.sync = function() {
        var path = userService.url+'users/'+user.id;

        return $http.put(path, user)
          .then(function(response) {
            return response.data;
          }, function(e) {
            $log.error(e);
            return $q.reject();
          });
      };

      // Add custom behaviour to the user
      angular.forEach(userService.behaviours, function(func, name) {
        user[name] = function() { return func(user, arguments); };
      });

      return user;
    }

    function fetchUserData(id) {
      var path = userService.url+'users/'+id;

      return $http.get(path)
        .then(function(response) {
          return response.data;
        }, function(e) {
          $log.error(e);
          return $q.reject();
        });
    }

    function setCurrentUser(user) {
      // Ensure the user has the madatory details
      var minimum = [
            'id', 
            'authToken',
            'title',
            'firstName',
            'lastName',
          ];

      if ( lodash.intersection(minimum, lodash.keys(user)).length !== minimum.length ) {
        $log.warn('missing details', minimum, lodash.keys(user));
        return false;
      }

      initUser(user);
      $http.defaults.headers.common.Authorization = user.authToken;
      $cookies.putObject(userCookieName, _.pick(user, minimum));

      return loggedInUser = user;
    }

    function clearCurrentUser() {
      $http.defaults.headers.common.Authorization = '';
      loggedInUser = null;
      $cookies.remove(userCookieName);
    }

    // Restore the user from previous session
    if ( _.isObject( $cookies.getObject(userCookieName) ) ) {
      setCurrentUser( $cookies.getObject(userCookieName) );

      if ( loggedInUser ) {
        // Flesh out the user. This also lets us check the session is still valid.
        fetchUserData( loggedInUser.id )
          .then(function(user) {
            // Copy the rest of the values across
            lodash.extend(loggedInUser, user);
          }, function(err) {
            // Session has expired
            clearCurrentUser();
          });        
      }
    }
    
    return {
      userTypes: userTypes,
      createUser: function(details) {
        var url = userService.url;

        switch( details.type ) {
          case 'customer':
            url += 'customers';
            break;
          case 'counsellor':
          case 'clinician':
            url += 'clinicians';
            break;
          default:
            $log.error('missing type');
            return $q.reject();
        }

        return $http.post(url, details)
          .then(function(response) {
            return setCurrentUser(response.data);
          }, function(error) {
            return $q.reject(error);
          });
      },
      logIn: function(email, password) {
        var url = userService.url+'users/login',
            body = {
              email: email,
              password: password,
            };

        return $http.post(url, body)
          .then(function(response) {
            return setCurrentUser(response.data);
          }, function(error) {
            return $q.reject(error);
          });
      },
      logOut: function() {
        clearCurrentUser();
      },
      getLoggedInUser: function() {
        return loggedInUser;
      },
      isEmailAvailable: function(email) {
        var url = userService.url+'users/email-available',
            body = {
              email: email,
            };

        return $http.post(url, body)
          .then(function(response) {
            return response.data;
          }, function(error) {
            return $q.reject(error);
          });
      },
      /** 
       * Finds the clinician via their:
       *  - Life Letters shortcode
       *  - APHRA number
       *  - email 
       */
      findClinician: function(code) {
        var url = userService.url+'users/exists',
            body = {
              shortCode: code,
              email: code,
              ahpraNumber: code,
            };

        return $http.post(url, body)
          .then(function(response) {
            return response.data;
          }, function(error) {
            return $q.reject(error);
          });
      },
      // TODO
      requestPasswordChange: function(/* email */) {
        var defer = $q.defer();
        $timeout(function() { defer.resolve(); });
        return defer.promise;
      },
      // TODO
      setPassword: function(/* password, authToken */) {
        // console.log(password, authToken);
        var defer = $q.defer();
        $timeout(function() { defer.resolve(); });
        return defer.promise;
      },
      // TODO
      isValidPasswordChangeToken: function(/* authToken */) {
        // console.log(authToken);
        var defer = $q.defer();
        $timeout(function() { defer.resolve(); });
        return defer.promise;
      },
      /**
       * Get the complete user including address and health information.
       * @return {[type]} [description]
       */
      fetchUser: function(id) {
        return initUser(fetchUserData(id));
      },
    };
  });
