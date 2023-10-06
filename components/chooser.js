export default function ObjectChooser({ selectedIndex, setSelectedIndex, choices, defaultOption, labelText }) {
    return (
        <label>
            {labelText}
            <select onChange={e => setSelectedIndex(parseInt(e.target.value))} value={selectedIndex}>
                {defaultOption && <option value="-1">{defaultOption}</option>}
                {choices.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
        </label>
    );
}

