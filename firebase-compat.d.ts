declare module "firebase/compat/app" {
  import firebase from "firebase";
  export default firebase;
}

declare module "firebase/compat/auth" {
  import "firebase/auth";
}

declare module "firebase/compat/firestore" {
  import "firebase/firestore";
}

