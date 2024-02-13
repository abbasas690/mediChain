import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { uploadAndPin } from './utils';

const Register = ({mediChain, connectWallet, token, account, setToken, setAccount}) => {
    const [designation, setDesignation] = useState("1");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [age, setAge] = useState('');
    // const [path,setPath] = useState('');

    // async function uploadAndPin(inputText) {

    //     console.log(typeof inputText.name)
        
    //         if (!inputText) {
    //             return;
    //         }

    //         try {
    //             const response = await fetch('http://localhost:3001/pinString', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 },
    //                 body: JSON.stringify({ text: JSON.stringify(inputText) }),
    //             });

    //             const data = await response.json();

    //             if (data.success) {
    //                 console.log('String pinned. CID:', typeof data.cid);
    //                 // setPath(data.cid)
    //                 return data.cid
    //             } else {
    //                 console.error('Failed to pin string:', data.error);
    //             }
    //         } catch (error) {
    //             console.error('Error pinning string:', error.message);
    //         }
    //     }

    const handleSubmit = async(e) => {
        e.preventDefault();
        if(account!=="" && designation==="1"){
            var record = {
                name: name,
                email: email,
                address: account,
                age: age,
                treatments: []
            };
                

            const path1 = await uploadAndPin(record)
            // console.log(name,age,designation,email,path1)
            // console.log(typeof name,typeof age,typeof designation,typeof email,typeof path1)
            await        mediChain.methods.register(name, parseInt(age), parseInt(designation), email,path1)
                    .send({from: account}).on('transactionHash', async (hash) => {
                        window.location.href = '/login'
                    })
        }else if(account!==""){
            mediChain.methods.register(name, 0, parseInt(designation), email, "").send({from: account}).on('transactionHash', async (hash) => {
                window.location.href = '/login'
            })
        }
    }

    useEffect(() => {
        var t = localStorage.getItem('token')
        var a = localStorage.getItem('account')
        t = t ? t : ""
        a = a ? a : ""
        if(t!=="" && a!=="") window.location.href = '/login';
        else{
            localStorage.removeItem('token')
            localStorage.removeItem('account')
            setToken('');
            setAccount('');
        }
    }, [token])

    return (
        <div className='register'>
            <div className='box'>
                <h2>Register</h2>
                <br />
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="formWallet">
                        <Form.Label>Connect Wallet</Form.Label>
                        { account === "" ?
                        <Form.Control type="button" value="Connect to Metamask" onClick={connectWallet}/>
                        : <Form.Control type="button" disabled value={`Connected Wallet with Address: ${account}`}/>
                        }
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formDesignation">
                        <Form.Label>Designation</Form.Label>
                        <Form.Select onChange={(e) => setDesignation(e.target.value)} value={designation}>
                            <option value="1">Patient</option>
                            <option value="2">Doctor</option>
                            <option value="3">Insurance Provider</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                    </Form.Group>
                    { designation==="1" ?
                    <Form.Group className="mb-3" controlId="formAge">
                        <Form.Label>Age</Form.Label>
                        <Form.Control type="number" value={age} min={18} onChange={(e) => setAge(e.target.value)} placeholder="Enter your age" />
                    </Form.Group>
                    : <></>
                    }
                    <Button variant="coolColor" type="submit">
                        Submit
                    </Button>
                </Form>
            </div>
        </div>
    )
}


export default Register