# webapp

Prerequisites for building and deploying your application locally.

1. All API request/response payloads should be in JSON.
2. No UI should be implemented for the application.
3. As a user, I expect all API calls to return with a proper HTTP status code.
4. As a user, I expect the code quality of the application to be maintained to the highest standards using the unit and/or integration tests.
5. Your web application must only support Token-Based authentication and not Session Authentication.
6. As a user, I must provide a basic authentication token when making an API call to the authenticated endpoint.

Build and Deploy instructions for the web application.

- Create a new user

1. As a user, I want to create an account by providing the following information.
Email Address
Password
First Name
Last Name
2. account_created field for the user should be set to the current time when user creation is successful.
3. Users should not be able to set values for account_created and account_updated. Any value provided for these fields must be ignored.
4. Password should never be returned in the response payload.
5. As a user, I expect to use my email address as my username.
6. Application must return 400 Bad Request HTTP response code when a user account with the email address already exists.
7. As a user, I expect my password to be stored securely using the BCrypt password hashing scheme with salt.

- Update user information

1. As a user, I want to update my account information. I should only be allowed to update the following fields.
First Name
Last Name
Password
2. Attempt to update any other field should return 400 Bad Request HTTP response code.
3. account_updated field for the user should be updated when the user update is successful.
4. A user can only update their own account information.

- Get user information
1. As a user, I want to get my account information. Response payload should return all fields for the user except for password...
