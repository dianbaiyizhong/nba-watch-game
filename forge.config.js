const {FusesPlugin} = require("@electron-forge/plugin-fuses");
const {FuseV1Options, FuseVersion} = require("@electron/fuses");


module.exports = {
    packagerConfig: {
        asar: true,
        appBundleId: "com.nntk.app",
        icon: "./build/icons/icon",
        extraResource: ['nba.db']
    },
    rebuildConfig: {},
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                options: {
                    icon: "./resources/icon.png"
                }
            }
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: ["darwin"],
            config: {
                icon: "./resources/icon.png"
            }
        },
        {
            name: "@electron-forge/maker-dmg",
            config: {
                icon: "./build/icons/icon.icns"
            }
        },
        {
            name: "@electron-forge/maker-deb",
            config: {
                options: {
                    icon: "./resources/icon.png"
                }
            }
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {
                options: {
                    icon: "./resources/icon.png"
                }
            }
        }
    ],
    plugins: [
        {
            name: "@electron-forge/plugin-auto-unpack-natives",
            config: {}
        },
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true
        })
    ]
};
