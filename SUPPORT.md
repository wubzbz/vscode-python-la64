# Support Guidelines for LoongArch64 Port

> [!NOTE]
> Please check the [Known Issues and Possible Solutions](./KNOWN_ISSUE.md) page first!

## 🎯 Where to Report Issues?

**Please report issues in THIS repository when:**
- The issue is related to **LoongArch64 architecture**
- Specific behavior or errors occur only on LoongArch64 platforms
- Build, installation, or packaging problems with this port
- Feature requests specific to LoongArch64

**Please report issues in the [OFFICIAL REPOSITORY](https://github.com/microsoft/vscode-python) when:**
- The issue occurs across all architectures
- Related to core Python language support or IntelliSense (not architecture-specific)
- General feature problems that also appear in official versions
- Issues related to VSCode core functionality or other extensions

## 🔍 Issue Categorization Guide

| Issue Type | Report Location | Reason |
|------------|-----------------|--------|
| **LoongArch64 build failure** | ✅ **THIS REPOSITORY** | Architecture-specific |
| **Runtime crash on LoongArch64** | ✅ **THIS REPOSITORY** | Platform-specific |
| **Python interpreter selection issue (LA64 only)** | ✅ **THIS REPOSITORY** | Architecture-related binding |
| **General Python editing / IntelliSense problem** | ⚠️ **OFFICIAL REPOSITORY** | Core functionality |
| **VSCode UI related issues** | ⚠️ **OFFICIAL REPOSITORY** | Editor integration |
| **Uncertain about issue origin** | 🔍 **START HERE** | We can help diagnose |

## 📝 When Reporting Issues, Please Provide

**Required Information:**
- Complete error messages and stack traces
- Your LoongArch64 system information (OS, kernel version)
- Python version and architecture being used
- Specific commit hash of this port

**Useful Diagnostic Information:**
```bash
# System information
uname -a
python -c "import sys; print(f'Python {sys.version} on {sys.platform}')"

# Extension log location
# For VSCodium: ~/.vscode-oss/extensions/wubzbz.python-*/logs
```

## ⚠️ Important Notes

**This is a community-maintained port:**
- This project is NOT officially supported and is maintained by the community
- Response times may not be as prompt as the official version
- Some advanced features may have limitations on LoongArch64

**Issue Triage Process:**
1. First check [existing issues of official repo](https://github.com/microsoft/vscode-python/issues) and [of this repo](https://github.com/wubzbz/vscode-python-la64/issues) for similar problems
2. Provide detailed reproduction steps and environment information
3. If the issue likely belongs upstream, we will assist in reporting it

## 🔗 Related Links

- [Official VSCode Python Repository](https://github.com/microsoft/vscode-python)
- [Build Guide for LoongArch64](./BUILD_LA64.md)

---

## 💡 Before Reporting

To help us quickly identify the issue:

1. **Test with minimal setup** - Try reproducing with basic configuration
2. **Check debug logs** - Enable debug mode and include relevant log sections (see VSCode `Developer: Set Log Level...` command)
3. **Compare with x86_64** - If possible, test if the same issue occurs on x86_64
4. **Provide reproduction steps** - Clear steps to reproduce the problem

## 🐛 Common LoongArch64-Specific Issues

We're particularly interested in:
- Memory alignment problems
- Endianness-related issues
- Instruction set compatibility
- Library binding problems
- Performance characteristics on LA64

**Thank you for helping improve the LoongArch64 port!** 🚀
