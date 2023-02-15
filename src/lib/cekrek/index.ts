// interface CheckAccountRequest {
//     accountBank: string;
//     accountNumber: string;
// }

interface CheckAccountResponse {
    status: number;
    message: string;
    data: {
        accountName: string;
    }[];
}

export async function cekRek(accountBank: string, accountNumber: string) {
    const url = "https://cekrek.heirro.dev/api/check";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                accountBank,
                accountNumber,
            }),
        });
        const data: CheckAccountResponse = await response.json();
        if (data.status === 200) {
            return data.data; //[0]["accountName"];
        } else {
            throw new Error(data.message);
        }
    } catch (e) {
        console.error("something went wrong : ", e);
        throw e;
    }
}
