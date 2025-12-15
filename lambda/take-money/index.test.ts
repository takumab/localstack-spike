import { describe, expect, test } from "vitest";
import { type Amount, type Repository, takeMoney } from "./index";

describe("take-money Lambda Function", async () => {
	test("should process take money request", async () => {
		const list: Amount[] = [];
		const body: Amount = { amount: 100, status: "PENDING" };
		const repository: Repository = {
			save: async (amount: Amount) => {
				list.push(amount);
			},
		};

		await takeMoney(body, repository);

		expect(list.length).toBe(1);
	});
});
