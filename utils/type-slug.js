export default (type) => {
    if (type === 'package') return 'pkg';
    if (type === 'image') return 'img';
    return type;
};
