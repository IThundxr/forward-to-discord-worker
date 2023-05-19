const PostalMime = require("postal-mime");

async function streamToArrayBuffer(stream, streamSize) {
	let result = new Uint8Array(streamSize);
	let bytesRead = 0;
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		result.set(value, bytesRead);
		bytesRead += value.length;
	}
	return result;
}

export default {
	async email(message, env, ctx) {
		const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
		const parser = new PostalMime.default();
		const parsedEmail = await parser.parse(rawEmail);

		await fetch(env.DISCORD_WEBHOOK_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				embeds: [{
					title: "DMARC Report",
					description: `From: ${message.from} \nSubject: ${message.headers.get("subject")} \nContent: \`\`\`${parsedEmail.text}\`\`\``,
					color: 65496
				}]
			}),
		});

		parsedEmail.attachments.forEach(async att => {
			console.log(att)

			const form = new FormData();
			form.append("file1", att);
			await fetch(env.DISCORD_WEBHOOK_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/form-data",
				},
				body: form
			})
		});
	},
};
