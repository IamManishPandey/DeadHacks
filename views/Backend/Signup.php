<?php
  $Username = $_POST['Username'];
  $email = $_POST['email'];
  $Password = $_POST['Password'];
  $Confirm_Password = $_POST['Confirm_Password'];

  //Database Connection
    $conn = new mysqli('localhost', 'root', '', 'registeration');
     if($conn->connect_error){
       die('Connection failed'.$conn->connect_error);
     } 
     else{
       $stmt = $conn->prepare("inset into registeration( Username, email, Password, Confirm_Password) values (?,?,?,?)");
       $stmt->bind_param("ssss", $Username, $email, $Password, $Confirm_Password);
       $stmt->execute(); 
       echo "Registration Successful...";
       $stmt->close();
       $conn->close();
     }
?>