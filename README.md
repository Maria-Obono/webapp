# webapp

Prerequisites for building and deploying your application locally.
Sequelize, express, node js
-type---> npm install

-to start the app run ----> npm start


Build and Deploy instructions for the web application.

Add Product
Permissions - Only users with an account can create a product.
Test various failure scenarios:
Missing data for required field.
Invalid quantity
Negative number
String
Product SKU should be unique. Adding 2nd product with the same SKU should return an error.
Update Product
Authorization check - The product can only be updated by the user that created it.
Test various failure scenarios:
Missing data for required field.
Invalid quantity
Negative number
String
Product SKU should be unique. Updating the product's SKU should return an error if another product in the database has same SKU.
Delete Product
Authorization check - The product can only be deleted by the user that created it.
Try deleting a product that has already been deleted.