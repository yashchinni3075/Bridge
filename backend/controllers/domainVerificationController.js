import StartupProfile from '../models/StartupProfile.js';
import {
  cleanDomain,
  generateVerificationToken,
  checkDomainTxtRecord,
} from '../services/domainVerificationService.js';

// @desc    Get current domain verification status
// @route   GET /api/verification/domain
// @access  Private (Startup only)
export const getDomainVerificationStatus = async (req, res, next) => {
  try {
    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    const domainInfo = profile.domainVerification || {
      domain: '',
      status: 'not_requested',
      verificationToken: null,
      recordType: 'TXT',
      recordHost: '@',
      verifiedAt: null,
      lastCheckedAt: null,
      failureReason: null,
    };

    return res.status(200).json({
      success: true,
      domainVerification: domainInfo,
      isPlatformOperational: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate optional domain verification
// @route   POST /api/verification/domain/initiate
// @access  Private (Startup only)
export const initiateDomainVerification = async (req, res, next) => {
  try {
    const { domain } = req.body;
    const sanitizedDomain = cleanDomain(domain);

    if (!sanitizedDomain) {
      return res.status(400).json({
        success: false,
        message: 'A valid domain name is required to request domain verification.',
      });
    }

    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    const token = generateVerificationToken();

    profile.domainVerification = {
      domain: sanitizedDomain,
      status: 'pending',
      verificationToken: token,
      recordType: 'TXT',
      recordHost: '@',
      verifiedAt: null,
      lastCheckedAt: new Date(),
      failureReason: null,
    };

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Domain verification initiated. Add the TXT record to your DNS settings.',
      domainVerification: profile.domainVerification,
      dnsInstructions: {
        recordType: 'TXT',
        host: '@',
        value: token,
        instructions: `Add a DNS TXT record on ${sanitizedDomain} with host '@' (or root) and value '${token}'.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify domain DNS TXT record
// @route   POST /api/verification/domain/verify
// @access  Private (Startup only)
export const verifyDomain = async (req, res, next) => {
  try {
    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    const currentVerification = profile.domainVerification;
    if (!currentVerification || !currentVerification.verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'No domain verification in progress. Please initiate verification first.',
      });
    }

    const result = await checkDomainTxtRecord(
      currentVerification.domain,
      currentVerification.verificationToken
    );

    currentVerification.lastCheckedAt = new Date();

    if (result.verified) {
      currentVerification.status = 'verified';
      currentVerification.verifiedAt = new Date();
      currentVerification.failureReason = null;
      await profile.save();

      return res.status(200).json({
        success: true,
        message: `Domain ${currentVerification.domain} successfully verified!`,
        domainVerification: currentVerification,
      });
    }

    currentVerification.status = 'failed';
    currentVerification.failureReason = result.reason || 'Verification record not found.';
    await profile.save();

    return res.status(200).json({
      success: false,
      message: 'Domain verification check failed. Profile and startup remain fully operational.',
      domainVerification: currentVerification,
    });
  } catch (error) {
    next(error);
  }
};