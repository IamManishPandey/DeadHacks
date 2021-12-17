<?php
  $Username = $_GET['Username'];
  $email = $_GET['email'];
  $Password = $_GET['Password'];
  $Confirm_Password = $_GET['Confirm_Password'];

  //Database Connection
    $conn = new mysqli('localhost', 'root', '', 'registeration');
     if($conn->connect_error){
       die('Connection failed'.$conn->connect_error);
     } 
     else{
       $stmt = $conn->prepare("insert into registeration( Username, email, Password, Confirm_Password) values (?,?,?,?)");
       $stmt->bind_param("ssss", $Username, $email, $Password, $Confirm_Password);
       $stmt->execute(); 
       echo "Registration Successful...";
       $stmt->close();
       $conn->close();
     }
?>