async function runTests() {
    console.log("==> Registering User A...");
    let resA = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice", email: "alice@test.com", password: "password123" })
    });

    if (!resA.ok && resA.status !== 409) {
        console.log("Failed to register User A", await resA.text());
        process.exit(1);
    }

    if (resA.status === 409) {
        // Login instead if already exists from previous test
        console.log("==> User A already exists. Logging in...");
        resA = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "alice@test.com", password: "password123" })
        });
    }

    const cookiesA = resA.headers.get("set-cookie");
    console.log("User A Cookie:", cookiesA);

    console.log("\n==> Registering User B...");
    let resB = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bob", email: "bob@test.com", password: "password123" })
    });

    if (resB.status === 409) {
        console.log("==> User B already exists. Logging in...");
        resB = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "bob@test.com", password: "password123" })
        });
    }

    const cookiesB = resB.headers.get("set-cookie");

    console.log("\n==> User A Creates a Task...");
    const taskRes = await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookiesA
        },
        body: JSON.stringify({ title: "Alice's Secret Task", description: "Only Alice can see", priority: "high", status: "todo" })
    });
    const createdTask = await taskRes.json();
    console.log("Created:", createdTask);

    console.log("\n==> User B fetching tasks...");
    const listBRes = await fetch("http://localhost:3000/api/tasks", {
        headers: { "Cookie": cookiesB }
    });
    const tasksB = await listBRes.json();
    console.log("User B Tasks (Expect 0 Alice tasks):", tasksB);

    console.log("\n==> User A fetching tasks...");
    const listARes = await fetch("http://localhost:3000/api/tasks", {
        headers: { "Cookie": cookiesA }
    });
    const tasksA = await listARes.json();
    console.log(`User A Tasks (Expect > 0): Found ${tasksA.length}`);
}

runTests().catch(console.error);
