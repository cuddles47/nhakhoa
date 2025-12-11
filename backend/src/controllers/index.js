class IndexController {
    async getHello(req, res) {
        res.json({ message: "Hello, World!" });
    }

    async getStatus(req, res) {
        res.json({ status: "API is running" });
    }
}

module.exports = new IndexController();