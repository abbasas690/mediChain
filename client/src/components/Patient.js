import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import { Link } from "react-router-dom";
import Web3 from "web3";
import { uploadAndPin } from "./utils";
import { v4 as uuidv4 } from "uuid";

const Patient = ({ mediChain, account, ethValue }) => {
  const [patient, setPatient] = useState(null);
  const [docEmail, setDocEmail] = useState("");
  const [docList, setDocList] = useState([]);
  const [insurer, setInsurer] = useState(null);
  const [insurerList, setInsurerList] = useState([]);
  const [buyFromInsurer, setBuyFromInsurer] = useState(null);
  const [policyList, setPolicyList] = useState([]);
  const [buyPolicyIndex, setBuyPolicyIndex] = useState(null);
  const [transactionsList, setTransactionsList] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [patientRecord, setPatientRecord] = useState(null);
  const [patientlabRecord, setPatientlabRecord] = useState(null);
  const [showlabRecordModal, setShowlabRecordModal] = useState(false);
  const [appointment, setAppointment] = useState({});
  const [Viewappointment, setViewAppointment] = useState({ appointments: [] });
  const [appointmentShow, setAppointmentShow] = useState(false);

  const getPatientData = async () => {
    var patient = await mediChain.methods.patientInfo(account).call();
    setPatient(patient);
  };
  const giveAccess = (e) => {
    e.preventDefault();
    mediChain.methods
      .permitAccess(docEmail)
      .send({ from: account })
      .on("transactionHash", (hash) => {
        return (window.location.href = "/login");
      });
  };
  const revokeAccess = async (email) => {
    var addr = await mediChain.methods.emailToAddress(patient.email).call();
    mediChain.methods
      .revokeAccess(addr)
      .send({ from: account })
      .on("transactionHash", (hash) => {
        return (window.location.href = "/login");
      });
  };
  const getDoctorAccessList = async () => {
    var doc = await mediChain.methods.getPatientDoctorList(account).call();
    let dt = [];
    for (let i = 0; i < doc.length; i++) {
      let doctor = await mediChain.methods.doctorInfo(doc[i]).call();
      dt = [...dt, doctor];
    }
    setDocList(dt);
  };
  const getInsurer = async () => {
    var insurer = await mediChain.methods
      .insurerInfo(patient.policy.insurer)
      .call();
    setInsurer(insurer);
  };
  const getInsurerList = async () => {
    var ins = await mediChain.methods.getAllInsurersAddress().call();
    let it = [];
    for (let i = 0; i < ins.length; i++) {
      let insurer = await mediChain.methods.insurerInfo(ins[i]).call();
      insurer = { ...insurer, account: ins[i] };
      it = [...it, insurer];
    }
    setInsurerList(it);
  };
  const getPolicyList = async () => {
    var policyList = await mediChain.methods
      .getInsurerPolicyList(buyFromInsurer)
      .call();
    setPolicyList(policyList);
  };
  const purchasePolicy = async (e) => {
    e.preventDefault();
    var value = policyList[buyPolicyIndex].premium / ethValue;
    mediChain.methods
      .buyPolicy(parseInt(policyList[buyPolicyIndex].id))
      .send({
        from: account,
        value: Web3.utils.toWei(value.toString(), "Ether"),
      })
      .on("transactionHash", (hash) => {
        return (window.location.href = "/login");
      });
  };
  const getTransactionsList = async () => {
    var transactionsIdList = await mediChain.methods
      .getPatientTransactions(account)
      .call();
    let tr = [];
    for (let i = transactionsIdList.length - 1; i >= 0; i--) {
      let transaction = await mediChain.methods
        .transactions(transactionsIdList[i])
        .call();
      let doctor = await mediChain.methods
        .doctorInfo(transaction.receiver)
        .call();
      transaction = {
        ...transaction,
        id: transactionsIdList[i],
        doctorEmail: doctor.email,
      };
      tr = [...tr, transaction];
    }
    setTransactionsList(tr);
  };
  const settlePayment = async (e, transaction) => {
    let value = transaction.value / ethValue;
    mediChain.methods
      .settleTransactionsByPatient(transaction.id)
      .send({
        from: account,
        value: Web3.utils.toWei(value.toString(), "Ether"),
      })
      .on("transactionHash", (hash) => {
        return (window.location.href = "/login");
      });
  };

  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowRecordModal = async () => {
    var record = {};
    await fetch(`https:ipfs.io/ipfs/${patient.record}`)
      .then((res) => res.json())
      .then((data) => {
        record = JSON.parse(data.message);
        console.log(typeof record);
      });
    await setPatientRecord(record);
    await setShowRecordModal(true);
  };
  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setAppointment((values) => ({ ...values, [name]: value }));
  };
  const handleshowAppointment = async (e) => {
    e.preventDefault();
    let record = {};
    await fetch(`https:ipfs.io/ipfs/${patient.appointment}`)
      .then((res) => res.json())
      .then((data) => {
        record = JSON.parse(data.message);
        console.log(record);
      });

    setViewAppointment(record);
    setAppointmentShow(true);
  };
  const handleAppointment = async (e) => {
    e.preventDefault();
    let record = {};
    await fetch(`https:ipfs.io/ipfs/${patient.appointment}`)
      .then((res) => res.json())
      .then((data) => {
        record = JSON.parse(data.message);
        console.log(record);
      });
    record.appointments = [
      {
        id: uuidv4(),
        accept: false,
        reject: false,
        patientEmail: patient.email,
        ...appointment,
      },
      ...record.appointments,
    ];
    var addr = await mediChain.methods.emailToAddress(patient.email).call();
    await uploadAndPin(record).then((result) => {
      console.log(result);
      mediChain.methods
        .makeAppointment(addr, result)
        .send({ from: account })
        .on("transactionHash", (hash) => {
          return (window.location.href = "/dashboard");
        });
    });
    console.log(appointment);
    console.table(record);
    console.log(patient.appointment);
  };

  const handleCloselabRecordModal = () => setShowlabRecordModal(false);
  const handleShowlabRecordModal = async () => {
    var record = {};
    await fetch(`https:ipfs.io/ipfs/${patient.labRecord}`)
      .then((res) => res.json())
      .then((data) => {
        record = JSON.parse(data.message);
        console.log(typeof record);
      });
    await setPatientlabRecord(record);
    await setShowlabRecordModal(true);
  };
  useEffect(() => {
    if (account === "") return (window.location.href = "/login");
    if (!patient) getPatientData();
    if (docList.length === 0) getDoctorAccessList();
    if (patient?.policyActive) getInsurer();
    if (insurerList.length === 0) getInsurerList();
    if (buyFromInsurer) getPolicyList();
    if (transactionsList.length === 0) getTransactionsList();
  }, [patient, docList, insurerList, buyFromInsurer, transactionsList]);

  return (
    <div>
      {patient ? (
        <>
          <div className="box">
            <h2>Patient's Profile</h2>
            <Form>
              <Form.Group>
                <Form.Label>Name: {patient.name}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Email address: {patient.email}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Age: {patient.age}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Address: {account}</Form.Label>
              </Form.Group>
            </Form>
            <div>
              <span>Your records are stored here: &nbsp; &nbsp;</span>
              <Button
                variant="coolColor"
                style={{ width: "20%", height: "4vh", marginBottom: "1rem" }}
                onClick={handleShowRecordModal}
              >
                View Records
              </Button>
            </div>
            <div>
              <span>Your Report are stored here: &nbsp; &nbsp;</span>
              <Button
                variant="coolColor"
                style={{ width: "20%", height: "4vh" }}
                onClick={handleShowlabRecordModal}
              >
                View Report
              </Button>
            </div>
          </div>
          <div className="box">
            <h2>Share Your Medical Record with Doctor & Lab Technician</h2>
            <Form onSubmit={giveAccess}>
              <Form.Group className="mb-3">
                <Form.Label>Email:</Form.Label>
                <Form.Control
                  required
                  type="email"
                  value={docEmail}
                  onChange={(e) => setDocEmail(e.target.value)}
                  placeholder="Enter doctor's email"
                ></Form.Control>
              </Form.Group>
              <Button variant="coolColor" type="submit">
                Submit
              </Button>
            </Form>
            <br />
            <h4>
              List of Doctor's & Lab Technician you have given access to your
              medical records
            </h4>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Doctor&nbsp;Name</th>
                  <th>Doctor&nbsp;Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {docList.length > 0 ? (
                  docList.map((doc, idx) => {
                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>Dr. {doc.name}</td>
                        <td>{doc.email}</td>
                        <td>
                          <Button
                            className="btn-danger"
                            onClick={() => revokeAccess(doc.email)}
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <></>
                )}
              </tbody>
            </Table>
          </div>
          <div className="box">
            <h2>Make Appointment with Docter</h2>
            <Form
              onSubmit={(e) => {
                handleAppointment(e);
              }}
            >
              <Form.Group>
                <Form.Label>Date: </Form.Label>
                <Form.Control
                  name="date"
                  type="date"
                  onChange={(e) => {
                    handleChange(e);
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label> doctor Email : </Form.Label>
                <Form.Control
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  onChange={(e) => {
                    handleChange(e);
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label> Description : </Form.Label>
                <Form.Control
                  name="description"
                  type="text"
                  onChange={(e) => {
                    handleChange(e);
                  }}
                />
              </Form.Group>
              <Button
                variant="coolColor"
                type="submit"
                style={{ marginTop: "1rem", marginRight: "1rem" }}
              >
                Make Appointment
              </Button>
              <Button
                variant="coolColor"
                type="button"
                style={{ marginTop: "1rem" }}
                onClick={(e) => handleshowAppointment(e)}
              >
                View Appointment
              </Button>
            </Form>
          </div>
          <div className="box">
            {patient.policyActive && insurer ? (
              <>
                <h2>Insurance Policy Details</h2>
                <Form>
                  <Form.Group>
                    <Form.Label>
                      Insurance Provider Name: {insurer.name}
                    </Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Email address: {insurer.email}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>
                      Insurance Policy Name: {patient.policy.name}
                    </Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>
                      Insurance Duration: {patient.policy.timePeriod} Year
                      {patient.policy.timePeriod > 1 ? "s" : ""}
                    </Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>
                      Remaining Cover Value: INR {patient.policy.coverValue}
                    </Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>
                      Premium: INR {patient.policy.premium}/year
                    </Form.Label>
                  </Form.Group>
                </Form>
              </>
            ) : (
              <>
                <h2>Buy Insurance Policy</h2>
                <Form onSubmit={purchasePolicy}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Insurance Provider:</Form.Label>
                    <Form.Select
                      onChange={(e) => {
                        setBuyFromInsurer(e.target.value);
                        getPolicyList();
                      }}
                    >
                      <option>Choose</option>
                      {insurerList.length > 0 ? (
                        insurerList.map((ins, idx) => {
                          return (
                            <option key={idx} value={ins.account}>
                              {ins.name}
                            </option>
                          );
                        })
                      ) : (
                        <></>
                      )}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Insurance Policy:</Form.Label>
                    <Form.Select
                      onChange={(e) => setBuyPolicyIndex(e.target.value)}
                    >
                      <option>Choose</option>
                      {policyList.length > 0 ? (
                        policyList.map((pol, idx) => {
                          return (
                            <option key={idx} value={idx}>
                              {pol.name}
                            </option>
                          );
                        })
                      ) : (
                        <></>
                      )}
                    </Form.Select>
                  </Form.Group>
                  {policyList[buyPolicyIndex] ? (
                    <div>
                      <p>Policy Name: {policyList[buyPolicyIndex].name}</p>
                      <p>
                        Duration: {policyList[buyPolicyIndex].timePeriod} Year
                        {policyList[buyPolicyIndex].timePeriod > 1 ? "s" : ""}
                      </p>
                      <p>
                        Cover Value: INR {policyList[buyPolicyIndex].coverValue}
                      </p>
                      <p>
                        Premium: INR {policyList[buyPolicyIndex].premium}/year
                      </p>
                    </div>
                  ) : (
                    <></>
                  )}
                  <Button variant="coolColor" type="submit">
                    Buy Policy
                  </Button>
                </Form>
              </>
            )}
          </div>
          <div className="box">
            <h2>List of Transactions</h2>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactionsList.length > 0 ? (
                  transactionsList.map((transaction, idx) => {
                    return (
                      <tr key={idx + 1}>
                        <td>{idx + 1}</td>
                        <td>{transaction.doctorEmail}</td>
                        <td>{transaction.value}</td>
                        <td>
                          {transaction.settled ? (
                            <span className="badge rounded-pill bg-success">
                              Settled
                            </span>
                          ) : (
                            <span className="badge rounded-pill bg-warning">
                              Pending
                            </span>
                          )}
                        </td>
                        <td>
                          {!transaction.settled ? (
                            <Button
                              className="btn-coolColor"
                              onClick={(e) => settlePayment(e, transaction)}
                            >
                              Pay
                            </Button>
                          ) : (
                            <Button className="btn-coolColor" disabled>
                              Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <></>
                )}
              </tbody>
            </Table>
          </div>
          {patientRecord ? (
            <Modal
              id="modal"
              size="lg"
              centered
              show={showRecordModal}
              onHide={handleCloseRecordModal}
            >
              <Modal.Header closeButton>
                <Modal.Title id="modalTitle">Medical Record:</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group>
                    <Form.Label>Patient Name: {patientRecord.name}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>
                      Patient Email: {patientRecord.email}
                    </Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Patient Age: {patientRecord.age}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Address: {patientRecord.address}</Form.Label>
                  </Form.Group>
                  <Table id="records" striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Sr.&nbsp;No.</th>
                        <th>Doctor&nbsp;Email</th>
                        <th>Date</th>
                        <th>Disease</th>
                        <th>Treatment</th>
                        <th>Prescription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientRecord.treatments.length > 0 ? (
                        patientRecord.treatments.map((treatment, idx) => {
                          return (
                            <tr key={idx + 1}>
                              <td>{idx + 1}</td>
                              <td>{treatment.doctorEmail}</td>
                              <td>{treatment.date}</td>
                              <td>{treatment.disease}</td>
                              <td>{treatment.treatment}</td>
                              <td>
                                {treatment.prescription ? (
                                  <Link
                                    to={`https://ipfs.io/ipfs/${treatment.prescription}`}
                                    target="_blank"
                                  >
                                    <Button variant="coolColor">View</Button>
                                  </Link>
                                ) : (
                                  "No document uploaded"
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <></>
                      )}
                    </tbody>
                  </Table>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseRecordModal}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          ) : (
            <></>
          )}
        </>
      ) : (
        <div>Loading...</div>
      )}
      {patientlabRecord ? (
        <Modal
          id="modal"
          size="lg"
          centered
          show={showlabRecordModal}
          onHide={handleCloselabRecordModal}
        >
          <Modal.Header closeButton>
            <Modal.Title id="modalTitle">Medical Record:</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Table id="records" striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Sr.&nbsp;No.</th>
                    <th>Lab Technician&nbsp;Email</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {patientlabRecord.labRecord.length > 0 ? (
                    patientlabRecord.labRecord.map((treatment, idx) => {
                      return (
                        <tr key={idx + 1}>
                          <td>{idx + 1}</td>
                          <td>{treatment.doctorEmail}</td>
                          <td>{treatment.date}</td>
                          <td>{treatment.treatment}</td>
                          <td>
                            {treatment.prescription ? (
                              <Link
                                to={`https://ipfs.io/ipfs/${treatment.prescription}`}
                                target="_blank"
                              >
                                <Button variant="coolColor">View</Button>
                              </Link>
                            ) : (
                              "No document uploaded"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <></>
                  )}
                </tbody>
              </Table>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloselabRecordModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      ) : (
        <></>
      )}
      {Viewappointment ? (
        <Modal
          id="modal"
          size="lg"
          centered
          show={appointmentShow}
          onHide={() => setAppointmentShow(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title id="modalTitle">Appointment :</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Table id="records" striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Sr.&nbsp;No.</th>
                    <th>Date</th>
                    <th>doctor Email</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Viewappointment.appointments.length > 0 ? (
                    Viewappointment.appointments.map((treatment, idx) => {
                      return (
                        <tr key={idx + 1}>
                          <td>{idx + 1}</td>
                          <td>{treatment.date}</td>
                          <td>{treatment.email}</td>
                          <td>{treatment.description}</td>
                          <td>
                            {treatment.accept === false &&
                            treatment.reject === false ? (
                              <p className=" badge  bg-warning">pending</p>
                            ) : treatment.accept === true ? (
                              <p className="badge  bg-success">accepted</p>
                            ) : treatment.reject === true ? (
                              <p className="badge  bg-danger">rejected</p>
                            ) : (
                              <></>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <></>
                  )}
                </tbody>
              </Table>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setAppointmentShow(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Patient;
