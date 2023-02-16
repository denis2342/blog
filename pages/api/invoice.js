import NextCors from "nextjs-cors";
import LightningRPC from "@/lib/lightning/rpc";
import { resolve } from "styled-jsx/css";

export default async function handler(req, res) {
	const rpc = new LightningRPC('/home/azureuser/.lightning/bitcoin/lightning-rpc');

	const body = JSON.parse(req.body);

	await NextCors(req, res, {
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
		origin: '*',
		optionsSuccessStatus: 200
	})

	await rpc.invoice(body.amount, body.description).then((bolt11) => {
		console.log("Invoice created:\n", bolt11)
		res.status(200).json({ bolt11: bolt11 });
	}).catch((error) => {
		res.status(400).json({ error: "Failed to create invoice" });
	});
}
