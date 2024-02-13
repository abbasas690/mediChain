
    async function uploadAndPin(inputText) {

        console.log(typeof inputText.name)
        
            if (!inputText) {
                return;
            }

            try {
                const response = await fetch('http://localhost:3001/pinString', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body:JSON.stringify( { text: JSON.stringify(inputText) }),
                });

                const data = await response.json();

                if (data.success) {
                    console.log('String pinned. CID:', typeof data.cid);
                    // setPath(data.cid)
                    return data.cid
                } else {
                    console.error('Failed to pin string:', data.error);
                }
            } catch (error) {
                console.error('Error pinning string:', error.message);
            }
        }
async function uploadFile(fileBuffer){

       const formData = new FormData();
    try{
        formData.append('file', fileBuffer);

            const result = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await result.json()
            if(data.success){
                return data.hash;

            }
            else{
                console.log("errro the file is not in good condition")
            }
        }
        catch(err){
            console.log("error pining the file: ",err.message)
        }
} 
export {uploadAndPin,uploadFile};

