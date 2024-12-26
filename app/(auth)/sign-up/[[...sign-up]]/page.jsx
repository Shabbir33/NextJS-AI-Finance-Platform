import { SignUp } from "@clerk/clerk-react";
import React from "react";

const page = () => {
  return (
    <div className="flex justify-center pt-40">
      <SignUp />
    </div>
  );
};

export default page;
