module.exports = (type) => {
    if (type === 'package') return 'PACKAGE';
    if (type === 'npm') return 'NPM';
    return 'MAP';
}