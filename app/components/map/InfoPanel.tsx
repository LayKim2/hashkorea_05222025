"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Place } from './MapComponent';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoPanelProps {
  restaurant: Place | null;
  onClose: () => void;
}

const InfoPanel = ({ restaurant, onClose }: InfoPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!restaurant) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white shadow-lg rounded-lg overflow-y-auto z-[1001] flex flex-col
            fixed md:top-[72px] md:right-0 md:bottom-auto md:left-auto md:w-96 md:max-w-xs md:h-[calc(100vh-72px-2rem)]
            bottom-0 left-0 right-0 w-full max-w-md h-auto md:rounded-lg rounded-t-2xl
            max-h-[70vh] md:max-h-none"
        >
          {/* Header with rating */}
          <div className="p-4 pb-2">
            <div className="flex text-amber-400 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>★</span>
              ))}
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-1">
              {restaurant.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Mer kue thant Oorus Buclolialgun oubrette bibag spitic tir San bastneon one pess come mar hen vronk areairs.
            </p>
            
            {/* Color dots */}
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-teal-500"></div>
              <div className="w-5 h-5 rounded-full bg-black"></div>
              <div className="w-5 h-5 rounded-full bg-orange-400"></div>
              <div className="w-5 h-5 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-400 ml-2">• nertus</span>
            </div>

            {/* Button */}
            <button className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded mb-6">
              Emloce Nomes
            </button>
          </div>

          {/* Features section */}
          <div className="px-4 pb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Srecjalt Erenatoms</h3>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-amber-300 mt-0.5 mr-3 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Dean spam rdel ahnor DLirangs? Cobah</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-amber-300 mt-0.5 mr-3 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Runur extae alen mbimi arn irea picuus die</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-amber-300 mt-0.5 mr-3 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Delnory Ivriki oeffilcwoutlor Memoraten</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-amber-300 mt-0.5 mr-3 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Buan seimsl bloan atine ponia sanona suon calemnus</span>
              </li>
            </ul>
          </div>

          {/* Search section */}
          <div className="px-4 pb-4">
            <div className="flex items-center border rounded-md px-3 py-2 mb-4">
              <span className="text-gray-600 mr-2">Cormness</span>
              <div className="ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom feature image */}
          <div className="mt-auto">
            <div className="relative">
              <Image 
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c" 
                alt="Food" 
                width={800}
                height={400}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 p-4 flex flex-col justify-end">
                <h3 className="text-white text-lg font-medium mb-2">Rowilipuleses Tou Cor Moishie Rour Sutinen Evodes Cush</h3>
                <div className="flex justify-between items-center">
                  <button className="bg-white bg-opacity-20 text-white text-sm px-4 py-1 rounded">
                    Delta uno
                  </button>
                  <div className="text-xs text-white">
                    <p>Replaice Fastalirpoce</p>
                    <p>Berithue Daminus</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoPanel; 