export default (type) => {
	if (type === "package") return "PACKAGE";
	if (type === "npm") return "NPM";
	if (type === "image") return "IMAGE";
	return "MAP";
};
