

const Toolbar = ({ onOpenVSCode, onCreateBranch, onCreateCommit, onOpenAsPage }) => (
  <div className="issue-toolbar">
    <button className="icon-btn" title="Open with VS Code" onClick={onOpenVSCode}>VS</button>
    <button className="icon-btn" title="Create branch" onClick={onCreateBranch}>Br</button>
    <button className="icon-btn" title="Create commit" onClick={onCreateCommit}>Cm</button>
    <button className="icon-btn" title="Open as page" onClick={onOpenAsPage}>↗</button>
  </div>
);

export default Toolbar;