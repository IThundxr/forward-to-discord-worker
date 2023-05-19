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
					description: `**From**: ${message.from} \n**Subject**: ${message.headers.get("subject")} \n**Content**: \`\`\`${parsedEmail.text}\`\`\``,
					color: 65496
				}]
			}),
		});
		// if (parsedEmail.attachments.length > 0) {
		// 	parsedEmail.attachments.forEach(async att => {
		// 		const form = new FormData();
		// 		form.append("file1", att);
		// 		await fetch(env.DISCORD_WEBHOOK_URL, {
		// 			method: "POST",
		// 			headers: {
		// 				"Content-Type": "application/form-data",
		// 			},
		// 			body: form
		// 		})
		// 	});
		// }

		if (parsedEmail.attachments.length > 0) {
			const form = new FormData();

			parsedEmail.attachments.forEach((att, index) => {
				form.append("payload_json", JSON.stringify({
					"content": "test"
				}));
				form.append(`file${index + 1}`, att,);
			});

			await fetch(env.DISCORD_WEBHOOK_URL, {
				method: "POST",
				headers: {
					"Content-Type": "multipart/form-data",
				},
				body: form,
			}).then(response => response.json()).then(response => console.log(response)).catch(err => console.error(err));
		}
	}
};
