// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IACL {
    function hasPermission(address _who, address _where, bytes32 _what) external view returns (bool);
}

contract Kernel {
    address public acl;
    address public kernelOwner;
    bool public initialized;

    event SetAcl(address indexed acl);
    event SetOwner(address indexed owner);

    modifier onlyKernelOwner() {
        require(msg.sender == kernelOwner, "KERNEL: CALLER_NOT_OWNER");
        _;
    }

    constructor() public {
        kernelOwner = msg.sender;
        emit SetOwner(msg.sender);
    }

    function initialize(address _acl, address _owner) external {
        require(!initialized, "KERNEL: ALREADY_INITIALIZED");
        require(_acl != address(0), "KERNEL: INVALID_ACL");
        require(_owner != address(0), "KERNEL: INVALID_OWNER");

        acl = _acl;
        kernelOwner = _owner;
        initialized = true;

        emit SetAcl(_acl);
        emit SetOwner(_owner);
    }

    function setAcl(address _acl) external onlyKernelOwner {
        require(_acl != address(0), "KERNEL: INVALID_ACL");
        acl = _acl;
        emit SetAcl(_acl);
    }

    function hasPermission(address _who, address _where, bytes32 _what) external view returns (bool) {
        if (acl == address(0)) {
            return false;
        }
        return IACL(acl).hasPermission(_who, _where, _what);
    }
}

contract ACL is IACL {
    bytes32 public constant CREATE_PERMISSIONS_ROLE = keccak256("CREATE_PERMISSIONS_ROLE");
    address public constant NO_PERMISSION_MANAGER = address(0);

    mapping(address => mapping(bytes32 => mapping(address => bool))) private permissions;
    mapping(address => mapping(bytes32 => address)) private permissionManagers;

    event SetPermission(address indexed entity, address indexed app, bytes32 indexed role, bool allowed);
    event ChangePermissionManager(address indexed app, bytes32 indexed role, address indexed manager);

    modifier onlyPermissionManager(address _app, bytes32 _role) {
        require(getPermissionManager(_app, _role) == msg.sender, "ACL: CALLER_NOT_ROLE_MANAGER");
        _;
    }

    constructor() public {}

    function initialize(address _permissionsCreator) external {
        require(getPermissionManager(address(this), CREATE_PERMISSIONS_ROLE) == NO_PERMISSION_MANAGER, "ACL: ALREADY_INITIALIZED");
        _createPermission(_permissionsCreator, address(this), CREATE_PERMISSIONS_ROLE, _permissionsCreator);
    }

    function createPermission(address _entity, address _app, bytes32 _role, address _manager) external {
        require(_manager != address(0), "ACL: INVALID_MANAGER");
        require(getPermissionManager(_app, _role) == NO_PERMISSION_MANAGER, "ACL: ROLE_ALREADY_EXISTS");
        require(hasPermission(msg.sender, address(this), CREATE_PERMISSIONS_ROLE), "ACL: CALLER_CANNOT_CREATE_PERMISSIONS");

        _createPermission(_entity, _app, _role, _manager);
    }

    function grantPermission(address _entity, address _app, bytes32 _role) external onlyPermissionManager(_app, _role) {
        require(!hasPermission(_entity, _app, _role), "ACL: PERMISSION_ALREADY_GRANTED");
        _setPermission(_entity, _app, _role, true);
    }

    function revokePermission(address _entity, address _app, bytes32 _role) external onlyPermissionManager(_app, _role) {
        require(hasPermission(_entity, _app, _role), "ACL: PERMISSION_ALREADY_REVOKED");
        _setPermission(_entity, _app, _role, false);
    }

    function setPermissionManager(address _newManager, address _app, bytes32 _role) external onlyPermissionManager(_app, _role) {
        require(_newManager != address(0), "ACL: INVALID_NEW_MANAGER");
        _setPermissionManager(_newManager, _app, _role);
    }

    function hasPermission(address _who, address _where, bytes32 _what) public override view returns (bool) {
        return permissions[_where][_what][_who];
    }

    function getPermissionManager(address _app, bytes32 _role) public view returns (address) {
        return permissionManagers[_app][_role];
    }

    function _createPermission(address _entity, address _app, bytes32 _role, address _manager) internal {
        _setPermission(_entity, _app, _role, true);
        _setPermissionManager(_manager, _app, _role);
    }

    function _setPermission(address _entity, address _app, bytes32 _role, bool _allowed) internal {
        permissions[_app][_role][_entity] = _allowed;
        emit SetPermission(_entity, _app, _role, _allowed);
    }

    function _setPermissionManager(address _newManager, address _app, bytes32 _role) internal {
        permissionManagers[_app][_role] = _newManager;
        emit ChangePermissionManager(_app, _role, _newManager);
    }
}

contract AragonVaultApp {
    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE");
    bytes32 public constant DEPOSIT_ROLE = keccak256("DEPOSIT_ROLE");

    Kernel public kernel;
    uint256 public totalVaultBalance;

    event Deposited(address indexed sender, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);

    modifier auth(bytes32 _role) {
        require(kernel.hasPermission(msg.sender, address(this), _role), "APP: AUTH_FAILED");
        _;
    }

    constructor(Kernel _kernel) public {
        require(address(_kernel) != address(0), "APP: INVALID_KERNEL");
        kernel = _kernel;
    }

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        require(msg.value > 0, "APP: ZERO_DEPOSIT");
        totalVaultBalance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(address payable _recipient, uint256 _amount) external auth(WITHDRAW_ROLE) {
        require(_recipient != address(0), "APP: INVALID_RECIPIENT");
        require(_amount > 0, "APP: ZERO_AMOUNT");
        require(_amount <= address(this).balance, "APP: INSUFFICIENT_BALANCE");
        require(_amount <= totalVaultBalance, "APP: INSUFFICIENT_VAULT_BALANCE");

        totalVaultBalance -= _amount;
        emit Withdrawn(_recipient, _amount);
        _recipient.transfer(_amount);
    }
}