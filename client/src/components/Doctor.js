import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import { Buffer } from "buffer";
import { Link } from "react-router-dom";
import { pinToPinata, uploadAndPin, uploadFile } from "./utils";

const Doctor = ({ mediChain, account }) => {
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [disease, setDisease] = useState("");
  const [treatment, setTreatment] = useState("");
  const [charges, setCharges] = useState("");
  const [fileBuffer, setFileBuffer] = useState(null);
  const [patList, setPatList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [transactionsList, setTransactionsList] = useState([]);
  const [appointment, setAppointment] = useState([]);

  const getDoctorData = async () => {
    var doctor = await mediChain.methods.doctorInfo(account).call();
    setDoctor(doctor);
  };
  const getPatientAccessList = async () => {
    var pat = await mediChain.methods.getDoctorPatientList(account).call();
    let pt = [];
    for (let i = 0; i < pat.length; i++) {
      let patient = await mediChain.methods.patientInfo(pat[i]).call();
      patient = { ...patient, account: pat[i] };
      pt = [...pt, patient];
    }
    setPatList(pt);
  };
  const getTransactionsList = async () => {
    var transactionsIdList = await mediChain.methods
      .getDoctorTransactions(account)
      .call();
    let tr = [];
    for (let i = transactionsIdList.length - 1; i >= 0; i--) {
      let transaction = await mediChain.methods
        .transactions(transactionsIdList[i])
        .call();
      let sender = await mediChain.methods
        .patientInfo(transaction.sender)
        .call();
      if (!sender.exists)
        sender = await mediChain.methods.insurerInfo(transaction.sender).call();
      transaction = {
        ...transaction,
        id: transactionsIdList[i],
        senderEmail: sender.email,
      };
      tr = [...tr, transaction];
    }
    setTransactionsList(tr);
  };
  const captureFile = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    setFileBuffer(file);
  };

  const handleCloseModal = () => setShowModal(false);
  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowModal = async (patient) => {
    await setPatient(patient);
    await setShowModal(true);
  };
  const handleShowRecordModal = async (patient) => {
    var record = {};
    await fetch(`https://ipfs.io/ipfs/${patient.record}`)
      .then((res) => res.json())
      .then((data) => (record = JSON.parse(data.message)));
    await setPatientRecord(record);
    await setShowRecordModal(true);
  };
  const submitDiagnosis = async (e) => {
    e.preventDefault();
    let file = "";
    if (fileBuffer) {
      await uploadFile(fileBuffer).then((res) => {
        file = res;
        console.log(res);
      });
      console.log(file);
    }

    var record = {};
    await fetch(`https://ipfs.io/ipfs/${patient.record}`)
      .then((res) => res.json())
      .then((data) => {
        record = JSON.parse(data.message);
      });
    const date = new Date();

    const formattedDate = date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    // console.log( record)
    record.treatments = [
      {
        disease,
        treatment,
        charges,
        prescription: file,
        date: formattedDate,
        doctorEmail: doctor.email,
      },
      ...record.treatments,
    ];
    record = record;
    await uploadAndPin(record).then((result) => {
      console.log(result);
      mediChain.methods
        .insuranceClaimRequest(patient.account, result, charges, 0)
        .send({ from: account })
        .on("transactionHash", (hash) => {
          return (window.location.href = "/login");
        });
    });
  };

  const handleAcceptAppointment = async (id, patientEmail, choice) => {
    console.log(patientEmail);
    var addr = await mediChain.methods.emailToAddress(patientEmail).call();
    let patient = await mediChain.methods.patientInfo(addr).call();
    let reacord = [];
    await fetch(`https:ipfs.io/ipfs/${patient.appointment}`)
      .then((res) => res.json())
      .then((data) => {
        reacord = JSON.parse(data.message);
      });
    let changedRecord = [];
    if (choice == 1) {
      changedRecord = reacord.appointments.map((d) =>
        d.id === id ? { ...d, accept: true, reject: false } : d
      );
    } else {
      changedRecord = reacord.appointments.map((d) =>
        d.id === id ? { ...d, reject: true, accept: false } : d
      );
    }
    console.log(changedRecord);
    changedRecord = { appointments: [...changedRecord] };
    await uploadAndPin(changedRecord).then((result) => {
      console.log(result);
      mediChain.methods
        .makeAppointment(addr, result)
        .send({ from: account })
        .on("transactionHash", (hash) => {
          return (window.location.href = "/dashboard");
        });
    });
  };
  const getAppointments = async () => {
    let appointment1 = [];
    for (const i of patList) {
      await fetch(`https:ipfs.io/ipfs/${i.appointment}`)
        .then((res) => res.json())
        .then((data) => {
          const d = JSON.parse(data.message);
          appointment1 = [...appointment1, ...d.appointments];
        });
    }
    setAppointment(appointment1);
  };

  useEffect(() => {
    if (account === "") return (window.location.href = "/login");
    if (!doctor) getDoctorData();
    if (patList.length === 0) getPatientAccessList();
    if (transactionsList.length === 0) getTransactionsList();
    if (appointment.length === 0) getAppointments();
  }, [doctor, patList, transactionsList]);

  return (
    <div>
      {doctor ? (
        <>
          <div className="box">
            <h2>Doctor's Profile</h2>
            <Form>
              <Form.Group>
                <Form.Label>Name: Dr. {doctor.name}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Email: {doctor.email}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Address: {account}</Form.Label>
              </Form.Group>
            </Form>
          </div>
          <div className="box">
            <h2>List of Patient's Medical Records</h2>
            <Table id="records" striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Patient&nbsp;Name</th>
                  <th>Patient&nbsp;Email</th>
                  <th>Action</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                {patList.length > 0 ? (
                  patList.map((pat, idx) => {
                    return (
                      <tr key={idx + 1}>
                        <td>{idx + 1}</td>
                        <td>{pat.name}</td>
                        <td>{pat.email}</td>
                        <td>
                          <Button
                            variant="coolColor"
                            onClick={(e) => handleShowModal(pat)}
                          >
                            Diagnose
                          </Button>
                        </td>
                        <td>
                          <Button
                            variant="coolColor"
                            onClick={(e) => handleShowRecordModal(pat)}
                          >
                            View
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
            <h2>appointments</h2>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Date</th>
                  <th>patient Email</th>
                  <th> Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointment.length > 0 ? (
                  appointment.map((transaction, idx) => {
                    return (
                      <tr key={idx + 1}>
                        <td>{idx + 1}</td>
                        <td>{transaction.date}</td>
                        <td>{transaction.patientEmail}</td>
                        <td>{transaction.description}</td>
                        <td>
                          <Button
                            className="secondary m-1"
                            onClick={() =>
                              handleAcceptAppointment(
                                transaction.id,
                                transaction.patientEmail,
                                1
                              )
                            }
                          >
                            accept
                          </Button>
                          <Button
                            className="btn-danger"
                            onClick={() =>
                              handleAcceptAppointment(
                                transaction.id,
                                transaction.patientEmail,
                                2
                              )
                            }
                          >
                            reject
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
            <button onClick={() => console.log(appointment)}> onClick</button>
          </div>
          <div className="box">
            <h2>List of Transactions</h2>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Sender&nbsp;Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactionsList.length > 0 ? (
                  transactionsList.map((transaction, idx) => {
                    return (
                      <tr key={idx + 1}>
                        <td>{idx + 1}</td>
                        <td>{transaction.senderEmail}</td>
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
                      </tr>
                    );
                  })
                ) : (
                  <></>
                )}
              </tbody>
            </Table>
          </div>
          {patient ? (
            <Modal
              id="modal"
              size="lg"
              centered
              show={showModal}
              onHide={handleCloseModal}
            >
              <Modal.Header closeButton>
                <Modal.Title id="modalTitle">
                  Enter diagnosis for: {patient.name}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Disease: </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={disease}
                      onChange={(e) => setDisease(e.target.value)}
                      placeholder="Enter disease"
                    ></Form.Control>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Treatment: </Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      value={treatment}
                      onChange={(e) => setTreatment(e.target.value)}
                      placeholder="Enter the treatment in details"
                    ></Form.Control>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Medical Charges: </Form.Label>
                    <Form.Control
                      required
                      type="number"
                      value={charges}
                      onChange={(e) => setCharges(e.target.value)}
                      placeholder="Enter medical charges incurred"
                    ></Form.Control>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload Prescription</Form.Label>
                    <Form.Control
                      onChange={captureFile}
                      accept=".jpg, .jpeg, .png, .pdf"
                      type="file"
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="coolColor"
                  onClick={submitDiagnosis}
                >
                  Submit Diagnosis
                </Button>
              </Modal.Footer>
            </Modal>
          ) : (
            <></>
          )}
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
    </div>
  );
};

export default Doctor;
