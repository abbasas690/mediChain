import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { uploadAndPin } from "./utils";

const Register = ({
  mediChain,
  connectWallet,
  token,
  account,
  setToken,
  setAccount,
}) => {
  const [designation, setDesignation] = useState("1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (account !== "" && designation === "1") {
      var record = {
        name: name,
        email: email,
        address: account,
        age: age,
        treatments: [],
      };
      var record1 = {
        labRecord: [],
      };
      var record2 = {
        appointments: [],
      };

      const path1 = await uploadAndPin(record);
      const path2 = await uploadAndPin(record1);
      const path3 = await uploadAndPin(record2);
      // console.log(name,age,designation,email,path1)
      // console.log(typeof name,typeof age,typeof designation,typeof email,typeof path1)
      await mediChain.methods
        .register(
          name,
          parseInt(age),
          parseInt(designation),
          email,
          path1,
          path2,
          path3,
          ""
        )
        .send({ from: account })
        .on("transactionHash", async (hash) => {
          window.location.href = "/login";
        });
    } else if (account !== "" && designation === "4") {
      mediChain.methods
        .register(name, 2, parseInt(2), email, "", "", "", "1")
        .send({ from: account })
        .on("transactionHash", async (hash) => {
          window.location.href = "/login";
        });
    } else if (account !== "") {
      mediChain.methods
        .register(name, 0, parseInt(designation), email, "", "", "", "")
        .send({ from: account })
        .on("transactionHash", async (hash) => {
          window.location.href = "/login";
        });
    }
  };

  useEffect(() => {
    var t = localStorage.getItem("token");
    var a = localStorage.getItem("account");
    t = t ? t : "";
    a = a ? a : "";
    if (t !== "" && a !== "") window.location.href = "/login";
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("account");
      setToken("");
      setAccount("");
    }
  }, [token]);

  return (
    <div className="register">
      <div className="box">
        <h2>Register</h2>
        <br />
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formWallet">
            <Form.Label>Connect Wallet</Form.Label>
            {account === "" ? (
              <Form.Control
                type="button"
                value="Connect to Metamask"
                onClick={connectWallet}
              />
            ) : (
              <Form.Control
                type="button"
                disabled
                value={`Connected Wallet with Address: ${account}`}
              />
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="formDesignation">
            <Form.Label>Designation</Form.Label>
            <Form.Select
              onChange={(e) => setDesignation(e.target.value)}
              value={designation}
            >
              <option value="1">Patient</option>
              <option value="2">Doctor</option>
              <option value="3">Insurance Provider</option>
              <option value="4">Lab Technician</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </Form.Group>
          {designation === "1" ? (
            <Form.Group className="mb-3" controlId="formAge">
              <Form.Label>Age</Form.Label>
              <Form.Control
                type="number"
                value={age}
                min={18}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
              />
            </Form.Group>
          ) : (
            <></>
          )}
          <Button variant="coolColor" type="submit">
            Submit
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Register;
